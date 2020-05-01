import knex from 'knex'
import { utils } from 'js-data'

import {
  Adapter,
  reserved
} from 'js-data-adapter'
import toString from 'lodash.tostring'
import snakeCase from 'lodash.snakecase'

const IgniteClient = require('apache-ignite-client')

const IgniteClientConfiguration = IgniteClient.IgniteClientConfiguration
const SqlFieldsQuery = IgniteClient.SqlFieldsQuery

const DEFAULTS = {}

const equal = function (query, field, value, isOr) {
  if (value === null) {
    return query[isOr ? 'orWhereNull' : 'whereNull'](field)
  }
  return query[getWhereType(isOr)](field, value)
}

const notEqual = function (query, field, value, isOr) {
  if (value === null) {
    return query[isOr ? 'orWhereNotNull' : 'whereNotNull'](field)
  }
  return query[getWhereType(isOr)](field, '!=', value)
}

const getWhereType = function (isOr) {
  return isOr ? 'orWhere' : 'where'
}

const MILES_REGEXP = /(\d+(\.\d+)?)\s*(m|M)iles$/
const KILOMETERS_REGEXP = /(\d+(\.\d+)?)\s*(k|K)$/

/**
 * Default predicate functions for the filtering operators.
 *
 * @name module:js-data-sql.OPERATORS
 * @property {Function} == Equality operator.
 * @property {Function} != Inequality operator.
 * @property {Function} > "Greater than" operator.
 * @property {Function} >= "Greater than or equal to" operator.
 * @property {Function} < "Less than" operator.
 * @property {Function} <= "Less than or equal to" operator.
 * @property {Function} isectEmpty Operator to test that the intersection
 * between two arrays is empty. Not supported.
 * @property {Function} isectNotEmpty Operator to test that the intersection
 * between two arrays is NOT empty. Not supported.
 * @property {Function} in Operator to test whether a value is found in the
 * provided array.
 * @property {Function} notIn Operator to test whether a value is NOT found in
 * the provided array.
 * @property {Function} contains Operator to test whether an array contains the
 * provided value. Not supported.
 * @property {Function} notContains Operator to test whether an array does NOT
 * contain the provided value. Not supported.
 */
export const OPERATORS = {
  '=': equal,
  '==': equal,
  '===': equal,
  '!=': notEqual,
  '!==': notEqual,
  '>': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '>', value)
  },
  '>=': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '>=', value)
  },
  '<': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '<', value)
  },
  '<=': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '<=', value)
  },
  'isectEmpty': function (query, field, value, isOr) {
    throw new Error('isectEmpty not supported!')
  },
  'isectNotEmpty': function (query, field, value, isOr) {
    throw new Error('isectNotEmpty not supported!')
  },
  'in': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, 'in', value)
  },
  'notIn': function (query, field, value, isOr) {
    return query[isOr ? 'orNotIn' : 'notIn'](field, value)
  },
  'contains': function (query, field, value, isOr) {
    throw new Error('contains not supported!')
  },
  'notContains': function (query, field, value, isOr) {
    throw new Error('notContains not supported!')
  },
  'like': function (query, field, value, isOr) {
    return query[getWhereType(isOr)](field, 'like', value)
  },
  'likei': function (query, field, value, isOr, knexInstance) {
    return query[getWhereType(isOr)](knexInstance.raw(`LOWER(${field})`), 'like', knexInstance.raw(`LOWER('${value}')`))
  },
  'near': function (query, field, value, isOr) {
    let radius
    let unitsPerDegree
    if (typeof value.radius === 'number' || MILES_REGEXP.test(value.radius)) {
      radius = typeof value.radius === 'number' ? value.radius : value.radius.match(MILES_REGEXP)[1]
      unitsPerDegree = 69.0 // miles per degree
    } else if (KILOMETERS_REGEXP.test(value.radius)) {
      radius = value.radius.match(KILOMETERS_REGEXP)[1]
      unitsPerDegree = 111.045 // kilometers per degree;
    } else {
      throw new Error('Unknown radius distance units')
    }

    let [latitudeColumn, longitudeColumn] = field.split(',').map((c) => c.trim())
    let [latitude, longitude] = value.center

    // Uses indexes on `latitudeColumn` / `longitudeColumn` if available
    query = query
      .whereBetween(latitudeColumn, [
        latitude - (radius / unitsPerDegree),
        latitude + (radius / unitsPerDegree)
      ])
      .whereBetween(longitudeColumn, [
        longitude - (radius / (unitsPerDegree * Math.cos(latitude * (Math.PI / 180)))),
        longitude + (radius / (unitsPerDegree * Math.cos(latitude * (Math.PI / 180))))
      ])

    if (value.calculateDistance) {
      let distanceColumn = (typeof value.calculateDistance === 'string') ? value.calculateDistance : 'distance'
      query = query.select(knex.raw(`
        ${unitsPerDegree} * DEGREES(ACOS(
          COS(RADIANS(?)) * COS(RADIANS(${latitudeColumn})) *
          COS(RADIANS(${longitudeColumn}) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(${latitudeColumn}))
        )) AS ${distanceColumn}`, [latitude, longitude, latitude]))
    }
    return query
  }
}

Object.freeze(OPERATORS)

/**
 * IgniteAdapter class.
 *
 * @example
 * // Use Container instead of DataStore on the server
 * import { Container } from 'js-data';
 * import IgniteAdapter from 'js-data-sql';
 *
 * // Create a store to hold your Mappers
 * const store = new Container();
 *
 * // Create an instance of IgniteAdapter with default settings
 * const adapter = new IgniteAdapter();
 *
 * // Mappers in "store" will use the Sql adapter by default
 * store.registerAdapter('sql', adapter, { default: true });
 *
 * // Create a Mapper that maps to a "user" table
 * store.defineMapper('user');
 *
 * @class IgniteAdapter
 * @extends Adapter
 * @param {Object} [opts] Configuration options.
 * @param {boolean} [opts.debug=false] See {@link Adapter#debug}.
 * @param {Object} [opts.knexOpts] See {@link IgniteAdapter#knexOpts}.
 * @param {Object} [opts.operators] See {@link IgniteAdapter#operators}.
 * @param {boolean} [opts.raw=false] See {@link Adapter#raw}.
 */
export function IgniteAdapter (opts) {
  utils.classCallCheck(this, IgniteAdapter)
  opts || (opts = {})
  opts.knexOpts || (opts.knexOpts = {})
  opts.igniteOpts || (opts.igniteOpts = {})
  utils.fillIn(opts, DEFAULTS)

  Object.defineProperties(this, {
    knex: {
      writable: true,
      value: undefined
    },

    igniteClient: {
      writable: true,
      value: undefined
    }
  })

  Adapter.call(this, opts)

  /**
   * Override the default predicate functions for specified operators.
   *
   * @name IgniteAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.knex || (this.knex = knex(this.knexOpts))

  /**
   * Override the default predicate functions for specified operators.
   *
   * @name IgniteAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.operators || (this.operators = {})
  utils.fillIn(this.operators, OPERATORS)

  // this.igniteOpts || (this.igniteOpts = {})

  this.igniteClient || (this.igniteClient = new IgniteClient(opts.igniteOpts.listener))

  if (opts.igniteOpts.debug) {
    this.igniteClient.setDebug(true)
  }

  const igniteClientConfiguration = new IgniteClientConfiguration(...opts.igniteOpts.endpoints)
    .setUserName(opts.igniteOpts.username)
    .setPassword(opts.igniteOpts.password)
    .setConnectionOptions(opts.igniteOpts.useTLS, opts.igniteOpts.connectionOptions)

  this.igniteClientConfiguration || (this.igniteClientConfiguration = igniteClientConfiguration)

  if (!opts.igniteOpts.manualConnect) {
    this.igniteClient.connect(this.igniteClientConfiguration)
  }
}

// async function connect () {
//   return this.igniteClient.connect(this.igniteClientConfiguration)
// }

function getTable (mapper) {
  return mapper.table || snakeCase(mapper.name)
}

function getCacheName (mapper) {
  return 'SQL_PUBLIC_' + getTable(mapper).toUpperCase()
}

function getFields (mapper, sqlBuilder) {
  const fields = mapper.schema.properties
  const table = getTable(mapper)

  for (const field in fields) {
    if (fields.hasOwnProperty(field)) {
      sqlBuilder = sqlBuilder.select(`${table}.${field}`)
    }
  }

  return sqlBuilder
}

function translateToKnex (mapper, values) {
  if (!values || !values.length) {
    return null
  }

  const fields = mapper.schema.properties

  const result = {}
  let i = 0

  for (const field in fields) {
    if (fields.hasOwnProperty(field)) {
      switch (fields[field].type) {
        case 'array':
          result[field] = JSON.parse(values[i++].replace(/\\/g, ''))
          break
        default:
          result[field] = values[i++]
          break
      }
    }
  }

  return result
}

/**
 * Alternative to ES2015 class syntax for extending `IgniteAdapter`.
 *
 * @example <caption>Using the ES2015 class syntax.</caption>
 * class MyIgniteAdapter extends IgniteAdapter {...};
 * const adapter = new MyIgniteAdapter();
 *
 * @example <caption>Using {@link IgniteAdapter.extend}.</caption>
 * const instanceProps = {...};
 * const classProps = {...};
 *
 * const MyIgniteAdapter = IgniteAdapter.extend(instanceProps, classProps);
 * const adapter = new MyIgniteAdapter();
 *
 * @method IgniteAdapter.extend
 * @static
 * @param {Object} [instanceProps] Properties that will be added to the
 * prototype of the subclass.
 * @param {Object} [classProps] Properties that will be added as static
 * properties to the subclass itself.
 * @return {Constructor} Subclass of `IgniteAdapter`.
 */
IgniteAdapter.extend = utils.extend

Adapter.extend({
  constructor: IgniteAdapter,

  async connect () {
    return this.igniteClient.connect(this.igniteClientConfiguration)
  },

  async _count (mapper, query, opts) {
    opts || (opts = {})
    query || (query = {})

    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts)
      .count('* as count')
      .toString()

    const countQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    const result = await (await cache.query(countQuery)).getAll()

    return [result[0][0], {}]
  },

  async _create (mapper, props, opts) {
    const idAttribute = mapper.idAttribute
    props || (props = {})
    opts || (opts = {})

    for (const field in props) {
      if (props.hasOwnProperty(field)) {
        const element = props[field]
        if (Array.isArray(element)) {
          props[field] = JSON.stringify(element)
        }
      }
    }

    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = sqlBuilder(getTable(mapper))
      .insert(props)
      .toString()

    const createQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(createQuery)

    return this._find(mapper, props[idAttribute], opts)
  },

  async _createMany (mapper, props, opts) {
    props || (props = {})
    opts || (opts = {})

    props = props.map((singleProps) => {
      for (const field in singleProps) {
        if (singleProps.hasOwnProperty(field)) {
          const element = singleProps[field]
          if (Array.isArray(element)) {
            singleProps[field] = JSON.stringify(element)
          }
        }
      }
      return singleProps
    })

    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = sqlBuilder(getTable(mapper))
      .insert(props)
      .toString()

    const createQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(createQuery)

    const query = {
      where: {
        [mapper.idAttribute]: {
          'in': props.map((singleProps) => singleProps[mapper.idAttribute])
        }
      }
    }

    return this._findAll(mapper, query, opts)
  },

  async _destroy (mapper, id, opts) {
    opts || (opts = {})

    const record = await this._find(mapper, id, opts)
    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = sqlBuilder(getTable(mapper))
      .where(mapper.idAttribute, toString(id))
      .del()
      .toString()

    const destroyQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(destroyQuery)

    return record
  },

  async _destroyAll (mapper, query, opts) {
    query || (query = {})
    opts || (opts = {})

    const records = await this._findAll(mapper, query, opts)
    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts)
      .del()
      .toString()

    const destroyAllQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(destroyAllQuery)

    return records
  },

  async _find (mapper, id, opts) {
    opts || (opts = {})

    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const table = getTable(mapper)
    const sqlText = getFields(mapper, sqlBuilder)
      .from(table)
      .where(`${table}.${mapper.idAttribute}`, toString(id))
      .toString()

    const findQuery = new SqlFieldsQuery(sqlText)

    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    const result = await (await cache.query(findQuery)).getAll()

    return [translateToKnex(mapper, result[0]), {}]
  },

  async _findAll (mapper, query, opts) {
    query || (query = {})
    opts || (opts = {})

    const sqlText = this.filterQuery(this.selectTable(mapper, opts), query, opts).toString()

    const findAllQuery = new SqlFieldsQuery(sqlText)

    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    const records = await (await cache.query(findAllQuery)).getAll()
    const result = records.map((record) => {
      return translateToKnex(mapper, record)
    })

    return [result, {}]
  },

  async _sum (mapper, field, query, opts) {
    if (!utils.isString(field)) {
      throw new Error('field must be a string!')
    }
    opts || (opts = {})
    query || (query = {})

    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts)
      .sum(`${field} as sum`)
      .toString()

    const sumQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    const result = await (await cache.query(sumQuery)).getAll()

    return [result[0][0], {}]
  },

  async _update (mapper, id, props, opts) {
    props || (props = {})
    opts || (opts = {})

    for (const field in props) {
      if (props.hasOwnProperty(field)) {
        const element = props[field]
        if (Array.isArray(element)) {
          props[field] = JSON.stringify(element)
        }
      }
    }

    delete props[mapper.idAttribute]
    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction
    const sqlText = sqlBuilder(getTable(mapper))
      .where(mapper.idAttribute, toString(id))
      .update(props)
      .toString()

    const updateQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(updateQuery)

    return this._find(mapper, id, opts)
  },

  async _updateAll (mapper, props, query, opts) {
    const idAttribute = mapper.idAttribute
    props || (props = {})
    query || (query = {})
    opts || (opts = {})

    props = props.map((singleProps) => {
      delete singleProps[idAttribute]
      return singleProps
    })

    const result = await this._findAll(mapper, query, opts)

    const records = result[0]
    const ids = records.map((record) => record[idAttribute])
    const sqlBuilder = utils.isUndefined(opts.transaction) ? this.knex : opts.transaction

    const sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts).update(props).toString()

    const updateAllQuery = new SqlFieldsQuery(sqlText)
    const cache = await this.igniteClient.getCache(getCacheName(mapper))
    await cache.query(updateAllQuery)

    const _query = { where: {} }
    _query.where[idAttribute] = { 'in': ids }
    return this._findAll(mapper, _query, opts)
  },

  async _updateMany (mapper, records, opts) {
    const idAttribute = mapper.idAttribute
    records || (records = [])
    opts || (opts = {})

    const tasks = records.map((record) => this._update(mapper, record[idAttribute], record, opts))

    return Promise.all(tasks).then((results) => [results.map((result) => result[0]), {}])
  },

  applyWhereFromObject (sqlBuilder, where, opts) {
    utils.forOwn(where, (criteria, field) => {
      if (!utils.isObject(criteria)) {
        criteria = { '==': criteria }
      }
      // Apply filter for each operator
      utils.forOwn(criteria, (value, operator) => {
        let isOr = false
        if (operator && operator[0] === '|') {
          operator = operator.substr(1)
          isOr = true
        }
        let predicateFn = this.getOperator(operator, opts)
        if (predicateFn) {
          sqlBuilder = predicateFn(sqlBuilder, field, value, isOr, this.knex)
        } else {
          throw new Error(`Operator ${operator} not supported!`)
        }
      })
    })
    return sqlBuilder
  },

  applyWhereFromArray (sqlBuilder, where, opts) {
    where.forEach((_where, i) => {
      if (_where === 'and' || _where === 'or') {
        return
      }
      const self = this
      const prev = where[i - 1]
      const parser = utils.isArray(_where) ? this.applyWhereFromArray : this.applyWhereFromObject
      if (prev) {
        if (prev === 'or') {
          sqlBuilder = sqlBuilder.orWhere(function () {
            parser.call(self, this, _where, opts)
          })
        } else {
          sqlBuilder = sqlBuilder.andWhere(function () {
            parser.call(self, this, _where, opts)
          })
        }
      } else {
        sqlBuilder = sqlBuilder.where(function () {
          parser.call(self, this, _where, opts)
        })
      }
    })
    return sqlBuilder
  },

  filterQuery (sqlBuilder, query, opts) {
    query = utils.plainCopy(query || {})
    opts || (opts = {})
    opts.operators || (opts.operators = {})
    query.where || (query.where = {})
    query.orderBy || (query.orderBy = query.sort)
    query.orderBy || (query.orderBy = [])
    query.skip || (query.skip = query.offset)

    // Transform non-keyword properties to "where" clause configuration
    utils.forOwn(query, (config, keyword) => {
      if (reserved.indexOf(keyword) === -1) {
        if (utils.isObject(config)) {
          query.where[keyword] = config
        } else {
          query.where[keyword] = {
            '==': config
          }
        }
        delete query[keyword]
      }
    })

    // Filter
    if (utils.isObject(query.where) && Object.keys(query.where).length !== 0) {
      // Apply filter for each field
      sqlBuilder = this.applyWhereFromObject(sqlBuilder, query.where, opts)
    } else if (utils.isArray(query.where)) {
      sqlBuilder = this.applyWhereFromArray(sqlBuilder, query.where, opts)
    }

    // Sort
    if (query.orderBy) {
      if (utils.isString(query.orderBy)) {
        query.orderBy = [
          [query.orderBy, 'asc']
        ]
      }
      for (var i = 0; i < query.orderBy.length; i++) {
        if (utils.isString(query.orderBy[i])) {
          query.orderBy[i] = [query.orderBy[i], 'asc']
        }
        sqlBuilder = sqlBuilder.orderBy(query.orderBy[i][0], (query.orderBy[i][1] || '').toUpperCase() === 'DESC' ? 'desc' : 'asc')
      }
    }

    // Offset
    if (query.skip) {
      sqlBuilder = sqlBuilder.offset(+query.skip)
    }

    // Limit
    if (query.limit) {
      sqlBuilder = sqlBuilder.limit(+query.limit)
    }

    return sqlBuilder
  },

  /**
   * Resolve the predicate function for the specified operator based on the
   * given options and this adapter's settings.
   *
   * @name IgniteAdapter#getOperator
   * @method
   * @param {string} operator The name of the operator.
   * @param {Object} [opts] Configuration options.
   * @param {Object} [opts.operators] Override the default predicate functions
   * for specified operators.
   * @return {*} The predicate function for the specified operator.
   */
  getOperator (operator, opts) {
    opts || (opts = {})
    opts.operators || (opts.operators = {})
    let ownOps = this.operators || {}
    return utils.isUndefined(opts.operators[operator]) ? ownOps[operator] : opts.operators[operator]
  },

  getTable (mapper) {
    return mapper.table || snakeCase(mapper.name)
  },

  selectTable (mapper, opts) {
    opts || (opts = {})
    const query = utils.isUndefined(opts.query) ? this.knex : opts.query
    const table = this.getTable(mapper)
    return getFields(mapper, query).from(table)
  }
})

/**
 * Details of the current version of the `js-data-ignite` module.
 *
 * @example
 * import { version } from 'js-data-ignite';
 * console.log(version.full);
 *
 * @name module:js-data-ignite.version
 * @type {object}
 * @property {string} version.full The full semver value.
 * @property {number} version.major The major version number.
 * @property {number} version.minor The minor version number.
 * @property {number} version.patch The patch version number.
 * @property {(string|boolean)} version.alpha The alpha version value,
 * otherwise `false` if the current version is not alpha.
 * @property {(string|boolean)} version.beta The beta version value,
 * otherwise `false` if the current version is not beta.
 */
export const version = '<%= version %>'
