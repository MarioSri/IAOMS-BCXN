declare module 'quill-better-table' {
  import { Quill } from 'react-quill';
  
  export default class QuillBetterTable {
    static keyboardBindings: any;
    insertTable(rows: number, columns: number): void;
  }
}
