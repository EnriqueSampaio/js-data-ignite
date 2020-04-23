
import {Adapter} from 'js-data-adapter'

interface IDict {
  [key: string]: any;
}
interface IBaseAdapter extends IDict {
  debug?: boolean,
  raw?: boolean
}
interface IBaseIgniteAdapter extends IBaseAdapter {
  knexOpts?: IDict
  igniteOpts?: IDict
}
export class IgniteAdapter extends Adapter {
  static extend(instanceProps?: IDict, classProps?: IDict): typeof IgniteAdapter
  constructor(opts?: IBaseIgniteAdapter)
}
export interface OPERATORS {
  '=': Function
  '==': Function
  '===': Function
  '!=': Function
  '!==': Function
  '>': Function
  '>=': Function
  '<': Function
  '<=': Function
  'isectEmpty': Function
  'isectNotEmpty': Function
  'in': Function
  'notIn': Function
  'contains': Function
  'notContains': Function,
  'like': Function,
  'near': Function
}
export interface version {
  full: string
  minor: string
  major: string
  patch: string
  alpha: string | boolean
  beta: string | boolean
}