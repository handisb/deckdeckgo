import {Doc, DocEntries, DeleteDoc} from '@deckdeckgo/editor';

import {cloud} from '../../../utils/core/environment.utils';
import {cloudProvider} from '../../../utils/core/providers.utils';

export const docs = async (userId: string): Promise<Doc[]> => {
  if (cloud()) {
    const {docEntries}: {docEntries: DocEntries} = await cloudProvider<{docEntries: DocEntries}>();

    return docEntries(userId);
  }

  throw new Error('Not implemented');
};

export const deleteDoc = async (docId: string): Promise<void> => {
  if (cloud()) {
    const {deleteDoc: deleteUserDoc}: {deleteDoc: DeleteDoc} = await cloudProvider<{deleteDoc: DeleteDoc}>();

    return deleteUserDoc(docId);
  }

  throw new Error('Not implemented');
};
