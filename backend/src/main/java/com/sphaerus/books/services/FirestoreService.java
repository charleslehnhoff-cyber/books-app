package com.sphaerus.books.services;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.stereotype.Service;

@Service
public class FirestoreService {
    private final Firestore db;

    public FirestoreService() {
        // Automatically picks up GOOGLE_APPLICATION_CREDENTIALS or default credentials
        FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance().toBuilder().build();
        this.db = firestoreOptions.getService();
    }

    public Firestore getDb() {
        return this.db;
    }
}
