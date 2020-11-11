let db;

// Create a new DB request
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = (e) => {
	const db = e.target.result;

	// Create Object Store and set key to autoincrement
	db.createObjectStore('pending', { autoIncrement: true });
};

request.onsuccess = (e) => {
	db = e.target.result;

	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = (e) => {
	console.log(`alert!: ${e.target.error}`);
};

function saveRecord(record) {
	const transaction = db.transaction(['pending'], 'readwrite');
	const store = transaction.objectStore('pending');

	store.add(record);
}

function checkDatabase() {
	// Open a transaction in the pending db
	const transaction = db.transaction(['pending'], 'readwrite');
	// Access pending object store
	const store = transaction.objectStore('pending');
	// Get all records from store and set to a variable
	const getAll = store.getAll();

	getAll.onsuccess = () => {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((response) => response.json)
				.then(() => {
					// If successful. open a transaction in the pending db
					const transaction = db.transaction(['pending'], 'readwrite');
					// Access pending object store
					const store = transaction.objectStore('pending');
					// Clear all items in the store
					store.clear();
				});
		}
	};
}

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
