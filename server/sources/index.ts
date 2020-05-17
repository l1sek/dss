import { Source } from '../model';

import { Wikidata } from './Wikidata';
import { StackExchange } from './StackExchange';
import { GitHub } from './GitHub';

/**
 *                      Add here your implementations of sources.
 */

export abstract class SourceImplementations {
    public static getSource(key:string):Source {
        switch(key) {


                /*----------------------------------------------------------------*\
                |    L I S T  O F  S O U R C E S  I M P L E M E N T A T I O N S    |
                |------------------------------------------------------------------|
                |  KEY     :   CLASS NAME (SAME NAME AS EXPORTED ABOVE)            |
                | - - - - -:- - - - - - - - - - - - - - - - - - - - - - - - - - - -|
                |  'xy'    : return new XyClassname       <-- this is an example  */
            case   'wd'    : return new Wikidata                                   ;
            case   'se'    : return new StackExchange                              ;
            case   'gh'    : return new GitHub                                     ;
                /*         :                                                       |
                \*----------------------------------------------------------------*/


            default: throw new Error("There is not any source implemented for key '" + key + "'.");
        }
    }
}