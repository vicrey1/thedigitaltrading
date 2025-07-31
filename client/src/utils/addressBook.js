// src/utils/addressBook.js
// Simple localStorage-based address book for admin wallet

const STORAGE_KEY = 'admin_wallet_address_book';

export function getAddressBook() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveAddressBook(addresses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export function addAddress(label, address) {
  const book = getAddressBook();
  book.push({ label, address });
  saveAddressBook(book);
}

export function removeAddress(address) {
  const book = getAddressBook().filter(a => a.address !== address);
  saveAddressBook(book);
}
