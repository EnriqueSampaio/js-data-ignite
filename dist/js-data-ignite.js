'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var knex = _interopDefault(require('knex'));
var jsData = require('js-data');
var jsDataAdapter = require('js-data-adapter');
var toString = _interopDefault(require('lodash.tostring'));
var snakeCase = _interopDefault(require('lodash.snakecase'));

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};





















var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var IgniteClient = require('apache-ignite-client');

var IgniteClientConfiguration = IgniteClient.IgniteClientConfiguration;
var SqlFieldsQuery = IgniteClient.SqlFieldsQuery;

var DEFAULTS = {};

var equal = function equal(query, field, value, isOr) {
  if (value === null) {
    return query[isOr ? 'orWhereNull' : 'whereNull'](field);
  }
  return query[getWhereType(isOr)](field, value);
};

var notEqual = function notEqual(query, field, value, isOr) {
  if (value === null) {
    return query[isOr ? 'orWhereNotNull' : 'whereNotNull'](field);
  }
  return query[getWhereType(isOr)](field, '!=', value);
};

var getWhereType = function getWhereType(isOr) {
  return isOr ? 'orWhere' : 'where';
};

var MILES_REGEXP = /(\d+(\.\d+)?)\s*(m|M)iles$/;
var KILOMETERS_REGEXP = /(\d+(\.\d+)?)\s*(k|K)$/;

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
var OPERATORS = {
  '=': equal,
  '==': equal,
  '===': equal,
  '!=': notEqual,
  '!==': notEqual,
  '>': function _(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '>', value);
  },
  '>=': function _(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '>=', value);
  },
  '<': function _(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '<', value);
  },
  '<=': function _(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, '<=', value);
  },
  'isectEmpty': function isectEmpty(query, field, value, isOr) {
    throw new Error('isectEmpty not supported!');
  },
  'isectNotEmpty': function isectNotEmpty(query, field, value, isOr) {
    throw new Error('isectNotEmpty not supported!');
  },
  'in': function _in(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, 'in', value);
  },
  'notIn': function notIn(query, field, value, isOr) {
    return query[isOr ? 'orNotIn' : 'notIn'](field, value);
  },
  'contains': function contains(query, field, value, isOr) {
    throw new Error('contains not supported!');
  },
  'notContains': function notContains(query, field, value, isOr) {
    throw new Error('notContains not supported!');
  },
  'like': function like(query, field, value, isOr) {
    return query[getWhereType(isOr)](field, 'like', value);
  },
  'likei': function likei(query, field, value, isOr, knexInstance) {
    return query[getWhereType(isOr)](knexInstance.raw('LOWER(' + field + ')'), 'like', knexInstance.raw('LOWER(\'' + value + '\')'));
  },
  'near': function near(query, field, value, isOr) {
    var radius = void 0;
    var unitsPerDegree = void 0;
    if (typeof value.radius === 'number' || MILES_REGEXP.test(value.radius)) {
      radius = typeof value.radius === 'number' ? value.radius : value.radius.match(MILES_REGEXP)[1];
      unitsPerDegree = 69.0; // miles per degree
    } else if (KILOMETERS_REGEXP.test(value.radius)) {
      radius = value.radius.match(KILOMETERS_REGEXP)[1];
      unitsPerDegree = 111.045; // kilometers per degree;
    } else {
      throw new Error('Unknown radius distance units');
    }

    var _field$split$map = field.split(',').map(function (c) {
      return c.trim();
    }),
        _field$split$map2 = slicedToArray(_field$split$map, 2),
        latitudeColumn = _field$split$map2[0],
        longitudeColumn = _field$split$map2[1];

    var _value$center = slicedToArray(value.center, 2),
        latitude = _value$center[0],
        longitude = _value$center[1];

    // Uses indexes on `latitudeColumn` / `longitudeColumn` if available


    query = query.whereBetween(latitudeColumn, [latitude - radius / unitsPerDegree, latitude + radius / unitsPerDegree]).whereBetween(longitudeColumn, [longitude - radius / (unitsPerDegree * Math.cos(latitude * (Math.PI / 180))), longitude + radius / (unitsPerDegree * Math.cos(latitude * (Math.PI / 180)))]);

    if (value.calculateDistance) {
      var distanceColumn = typeof value.calculateDistance === 'string' ? value.calculateDistance : 'distance';
      query = query.select(knex.raw('\n        ' + unitsPerDegree + ' * DEGREES(ACOS(\n          COS(RADIANS(?)) * COS(RADIANS(' + latitudeColumn + ')) *\n          COS(RADIANS(' + longitudeColumn + ') - RADIANS(?)) +\n          SIN(RADIANS(?)) * SIN(RADIANS(' + latitudeColumn + '))\n        )) AS ' + distanceColumn, [latitude, longitude, latitude]));
    }
    return query;
  }
};

Object.freeze(OPERATORS);

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
function IgniteAdapter(opts) {
  jsData.utils.classCallCheck(this, IgniteAdapter);
  opts || (opts = {});
  opts.knexOpts || (opts.knexOpts = {});
  opts.igniteOpts || (opts.igniteOpts = {});
  jsData.utils.fillIn(opts, DEFAULTS);

  Object.defineProperties(this, {
    knex: {
      writable: true,
      value: undefined
    },

    igniteClient: {
      writable: true,
      value: undefined
    }
  });

  jsDataAdapter.Adapter.call(this, opts);

  /**
   * Override the default predicate functions for specified operators.
   *
   * @name IgniteAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.knex || (this.knex = knex(this.knexOpts));

  /**
   * Override the default predicate functions for specified operators.
   *
   * @name IgniteAdapter#operators
   * @type {Object}
   * @default {}
   */
  this.operators || (this.operators = {});
  jsData.utils.fillIn(this.operators, OPERATORS);

  // this.igniteOpts || (this.igniteOpts = {})

  this.igniteClient || (this.igniteClient = new IgniteClient(opts.igniteOpts.listener));

  if (opts.igniteOpts.debug) {
    this.igniteClient.setDebug(true);
  }

  var igniteClientConfiguration = new (Function.prototype.bind.apply(IgniteClientConfiguration, [null].concat(toConsumableArray(opts.igniteOpts.endpoints))))().setUserName(opts.igniteOpts.username).setPassword(opts.igniteOpts.password).setConnectionOptions(opts.igniteOpts.useTLS, opts.igniteOpts.connectionOptions);

  this.igniteClientConfiguration || (this.igniteClientConfiguration = igniteClientConfiguration);

  if (!opts.igniteOpts.manualConnect) {
    this.igniteClient.connect(this.igniteClientConfiguration);
  }
}

// async function connect () {
//   return this.igniteClient.connect(this.igniteClientConfiguration)
// }

function getTable(mapper) {
  return mapper.table || snakeCase(mapper.name);
}

function getCacheName(mapper) {
  return 'SQL_PUBLIC_' + getTable(mapper).toUpperCase();
}

function getFields(mapper, sqlBuilder) {
  var fields = mapper.schema.properties;
  var table = getTable(mapper);

  for (var field in fields) {
    if (fields.hasOwnProperty(field)) {
      sqlBuilder = sqlBuilder.select(table + '.' + field);
    }
  }

  return sqlBuilder;
}

function translateToKnex(mapper, values) {
  if (!values || !values.length) {
    return null;
  }

  var fields = mapper.schema.properties;

  var result = {};
  var i = 0;

  for (var field in fields) {
    if (fields.hasOwnProperty(field)) {
      switch (fields[field].type) {
        case 'array':
          result[field] = JSON.parse(values[i++].replace(/\\/g, ''));
          break;
        default:
          result[field] = values[i++];
          break;
      }
    }
  }

  return result;
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
IgniteAdapter.extend = jsData.utils.extend;

jsDataAdapter.Adapter.extend({
  constructor: IgniteAdapter,

  connect: async function connect() {
    return this.igniteClient.connect(this.igniteClientConfiguration);
  },
  _count: async function _count(mapper, query, opts) {
    opts || (opts = {});
    query || (query = {});

    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts).count('* as count').toString();

    var countQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    var result = await (await cache.query(countQuery)).getAll();

    return [result[0][0], {}];
  },
  _create: async function _create(mapper, props, opts) {
    var idAttribute = mapper.idAttribute;
    props || (props = {});
    opts || (opts = {});

    for (var field in props) {
      if (props.hasOwnProperty(field)) {
        var element = props[field];
        if (Array.isArray(element)) {
          props[field] = JSON.stringify(element);
        }
      }
    }

    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = sqlBuilder(getTable(mapper)).insert(props).toString();

    var createQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(createQuery);

    return this._find(mapper, props[idAttribute], opts);
  },
  _createMany: async function _createMany(mapper, props, opts) {
    props || (props = {});
    opts || (opts = {});

    props = props.map(function (singleProps) {
      for (var field in singleProps) {
        if (singleProps.hasOwnProperty(field)) {
          var element = singleProps[field];
          if (Array.isArray(element)) {
            singleProps[field] = JSON.stringify(element);
          }
        }
      }
      return singleProps;
    });

    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = sqlBuilder(getTable(mapper)).insert(props).toString();

    var createQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(createQuery);

    var query = {
      where: defineProperty({}, mapper.idAttribute, {
        'in': props.map(function (singleProps) {
          return singleProps[mapper.idAttribute];
        })
      })
    };

    return this._findAll(mapper, query, opts);
  },
  _destroy: async function _destroy(mapper, id, opts) {
    opts || (opts = {});

    var record = await this._find(mapper, id, opts);
    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = sqlBuilder(getTable(mapper)).where(mapper.idAttribute, toString(id)).del().toString();

    var destroyQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(destroyQuery);

    return record;
  },
  _destroyAll: async function _destroyAll(mapper, query, opts) {
    query || (query = {});
    opts || (opts = {});

    var records = await this._findAll(mapper, query, opts);
    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts).del().toString();

    var destroyAllQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(destroyAllQuery);

    return records;
  },
  _find: async function _find(mapper, id, opts) {
    opts || (opts = {});

    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var table = getTable(mapper);
    var sqlText = getFields(mapper, sqlBuilder).from(table).where(table + '.' + mapper.idAttribute, toString(id)).toString();

    var findQuery = new SqlFieldsQuery(sqlText);

    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    var result = await (await cache.query(findQuery)).getAll();

    return [translateToKnex(mapper, result[0]), {}];
  },
  _findAll: async function _findAll(mapper, query, opts) {
    query || (query = {});
    opts || (opts = {});

    var sqlText = this.filterQuery(this.selectTable(mapper, opts), query, opts).toString();

    var findAllQuery = new SqlFieldsQuery(sqlText);

    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    var records = await (await cache.query(findAllQuery)).getAll();
    var result = records.map(function (record) {
      return translateToKnex(mapper, record);
    });

    return [result, {}];
  },
  _sum: async function _sum(mapper, field, query, opts) {
    if (!jsData.utils.isString(field)) {
      throw new Error('field must be a string!');
    }
    opts || (opts = {});
    query || (query = {});

    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts).sum(field + ' as sum').toString();

    var sumQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    var result = await (await cache.query(sumQuery)).getAll();

    return [result[0][0], {}];
  },
  _update: async function _update(mapper, id, props, opts) {
    props || (props = {});
    opts || (opts = {});

    for (var field in props) {
      if (props.hasOwnProperty(field)) {
        var element = props[field];
        if (Array.isArray(element)) {
          props[field] = JSON.stringify(element);
        }
      }
    }

    delete props[mapper.idAttribute];
    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;
    var sqlText = sqlBuilder(getTable(mapper)).where(mapper.idAttribute, toString(id)).update(props).toString();

    var updateQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(updateQuery);

    return this._find(mapper, id, opts);
  },
  _updateAll: async function _updateAll(mapper, props, query, opts) {
    var idAttribute = mapper.idAttribute;
    props || (props = {});
    query || (query = {});
    opts || (opts = {});

    props = props.map(function (singleProps) {
      delete singleProps[idAttribute];
      return singleProps;
    });

    var result = await this._findAll(mapper, query, opts);

    var records = result[0];
    var ids = records.map(function (record) {
      return record[idAttribute];
    });
    var sqlBuilder = jsData.utils.isUndefined(opts.transaction) ? this.knex : opts.transaction;

    var sqlText = this.filterQuery(sqlBuilder(getTable(mapper)), query, opts).update(props).toString();

    var updateAllQuery = new SqlFieldsQuery(sqlText);
    var cache = await this.igniteClient.getCache(getCacheName(mapper));
    await cache.query(updateAllQuery);

    var _query = { where: {} };
    _query.where[idAttribute] = { 'in': ids };
    return this._findAll(mapper, _query, opts);
  },
  _updateMany: async function _updateMany(mapper, records, opts) {
    var _this = this;

    var idAttribute = mapper.idAttribute;
    records || (records = []);
    opts || (opts = {});

    var tasks = records.map(function (record) {
      return _this._update(mapper, record[idAttribute], record, opts);
    });

    return Promise.all(tasks).then(function (results) {
      return [results.map(function (result) {
        return result[0];
      }), {}];
    });
  },
  applyWhereFromObject: function applyWhereFromObject(sqlBuilder, where, opts) {
    var _this2 = this;

    jsData.utils.forOwn(where, function (criteria, field) {
      if (!jsData.utils.isObject(criteria)) {
        criteria = { '==': criteria };
      }
      // Apply filter for each operator
      jsData.utils.forOwn(criteria, function (value, operator) {
        var isOr = false;
        if (operator && operator[0] === '|') {
          operator = operator.substr(1);
          isOr = true;
        }
        var predicateFn = _this2.getOperator(operator, opts);
        if (predicateFn) {
          sqlBuilder = predicateFn(sqlBuilder, field, value, isOr, _this2.knex);
        } else {
          throw new Error('Operator ' + operator + ' not supported!');
        }
      });
    });
    return sqlBuilder;
  },
  applyWhereFromArray: function applyWhereFromArray(sqlBuilder, where, opts) {
    var _this3 = this;

    where.forEach(function (_where, i) {
      if (_where === 'and' || _where === 'or') {
        return;
      }
      var self = _this3;
      var prev = where[i - 1];
      var parser = jsData.utils.isArray(_where) ? _this3.applyWhereFromArray : _this3.applyWhereFromObject;
      if (prev) {
        if (prev === 'or') {
          sqlBuilder = sqlBuilder.orWhere(function () {
            parser.call(self, this, _where, opts);
          });
        } else {
          sqlBuilder = sqlBuilder.andWhere(function () {
            parser.call(self, this, _where, opts);
          });
        }
      } else {
        sqlBuilder = sqlBuilder.where(function () {
          parser.call(self, this, _where, opts);
        });
      }
    });
    return sqlBuilder;
  },
  filterQuery: function filterQuery(sqlBuilder, query, opts) {
    query = jsData.utils.plainCopy(query || {});
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    query.where || (query.where = {});
    query.orderBy || (query.orderBy = query.sort);
    query.orderBy || (query.orderBy = []);
    query.skip || (query.skip = query.offset);

    // Transform non-keyword properties to "where" clause configuration
    jsData.utils.forOwn(query, function (config, keyword) {
      if (jsDataAdapter.reserved.indexOf(keyword) === -1) {
        if (jsData.utils.isObject(config)) {
          query.where[keyword] = config;
        } else {
          query.where[keyword] = {
            '==': config
          };
        }
        delete query[keyword];
      }
    });

    // Filter
    if (jsData.utils.isObject(query.where) && Object.keys(query.where).length !== 0) {
      // Apply filter for each field
      sqlBuilder = this.applyWhereFromObject(sqlBuilder, query.where, opts);
    } else if (jsData.utils.isArray(query.where)) {
      sqlBuilder = this.applyWhereFromArray(sqlBuilder, query.where, opts);
    }

    // Sort
    if (query.orderBy) {
      if (jsData.utils.isString(query.orderBy)) {
        query.orderBy = [[query.orderBy, 'asc']];
      }
      for (var i = 0; i < query.orderBy.length; i++) {
        if (jsData.utils.isString(query.orderBy[i])) {
          query.orderBy[i] = [query.orderBy[i], 'asc'];
        }
        sqlBuilder = sqlBuilder.orderBy(query.orderBy[i][0], (query.orderBy[i][1] || '').toUpperCase() === 'DESC' ? 'desc' : 'asc');
      }
    }

    // Offset
    if (query.skip) {
      sqlBuilder = sqlBuilder.offset(+query.skip);
    }

    // Limit
    if (query.limit) {
      sqlBuilder = sqlBuilder.limit(+query.limit);
    }

    return sqlBuilder;
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
  getOperator: function getOperator(operator, opts) {
    opts || (opts = {});
    opts.operators || (opts.operators = {});
    var ownOps = this.operators || {};
    return jsData.utils.isUndefined(opts.operators[operator]) ? ownOps[operator] : opts.operators[operator];
  },
  getTable: function getTable(mapper) {
    return mapper.table || snakeCase(mapper.name);
  },
  selectTable: function selectTable(mapper, opts) {
    opts || (opts = {});
    var query = jsData.utils.isUndefined(opts.query) ? this.knex : opts.query;
    var table = this.getTable(mapper);
    return getFields(mapper, query).from(table);
  }
});

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
var version = {
  full: '1.0.0',
  major: 1,
  minor: 0,
  patch: 0
};

exports.OPERATORS = OPERATORS;
exports.IgniteAdapter = IgniteAdapter;
exports.version = version;
//# sourceMappingURL=js-data-ignite.js.map
