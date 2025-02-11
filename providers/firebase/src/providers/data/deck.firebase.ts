import {CreateDeck, Deck, DeckData, DeckEntries, DeleteDeck, GetDeck, UpdateDeck, SnapshotDeck} from '@deckdeckgo/editor';

import {createEntry, deleteEntry, entries, getEntry, snapshotEntry, updateEntry} from '../../utils/data/firestore.queries';

export const deckEntries: DeckEntries = (userId: string): Promise<Deck[]> => {
  return entries<DeckData>({userId, collection: 'decks'});
};

export const deleteDeck: DeleteDeck = (deckId: string): Promise<void> => {
  return deleteEntry({id: deckId, collection: 'decks'});
};

export const createDeck: CreateDeck = (deck: DeckData): Promise<Deck> => {
  return createEntry<DeckData>({data: deck, collection: 'decks'});
};

export const getDeck: GetDeck = (deckId: string): Promise<Deck> => {
  return getEntry<DeckData>({id: deckId, collection: 'decks'});
};

export const updateDeck: UpdateDeck = (deck: Deck): Promise<Deck> => {
  return updateEntry<Deck>({entry: deck, collection: 'decks'});
};

export const snapshotDeck: SnapshotDeck = async ({
  deckId,
  onNext,
  onError
}: {
  deckId: string;
  onNext: (snapshot: Deck) => void;
  onError?: (error: string) => void;
}): Promise<() => void | undefined> => {
  return snapshotEntry<DeckData>({id: deckId, collection: 'decks', onNext, onError});
};
