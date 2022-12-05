import { createContext, Dispatch, ReactNode, useReducer } from 'react';

import reducer, { Action } from 'reducers/file';
import { DocFile } from 'types/file';

/**
 * Context used to provide files that have to be processed
 */
export const FileContext = createContext<DocFile[]>([]);
FileContext.displayName = 'FileContext';

/**
 * Context used to provide the dispatch function
 */
export const FileDispatchContext = createContext<Dispatch<Action>>(() => {});
FileDispatchContext.displayName = 'FileDispatchContext';
