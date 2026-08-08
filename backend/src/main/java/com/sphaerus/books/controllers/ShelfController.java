package com.sphaerus.books.controllers;

import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.sphaerus.books.models.Shelf;
import com.sphaerus.books.services.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shelves")
@CrossOrigin(origins = "*") // Update in prod
public class ShelfController {

    @Autowired private FirestoreService firestoreService;

    @GetMapping
    public List<Shelf> getAllShelves() throws ExecutionException, InterruptedException {
        List<Shelf> shelves = new ArrayList<>();
        List<QueryDocumentSnapshot> documents = firestoreService.getDb().collection("shelves").get().get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            Shelf shelf = document.toObject(Shelf.class);
            if (shelf.getId() == null) {
                shelf.setId(document.getId());
            }
            shelves.add(shelf);
        }
        shelves.sort(Comparator.comparing(s -> s.getOrder() != null ? s.getOrder() : 9999));
        return shelves;
    }

    @PostMapping
    public ResponseEntity<Shelf> createShelf(@RequestBody Map<String, String> payload) throws ExecutionException, InterruptedException {
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String shelfId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Shelf shelf = new Shelf();
        shelf.setId(shelfId);
        shelf.setName(name);
        shelf.setCreatedAt(Instant.now().toString());
        shelf.setOrder(9999);

        firestoreService.getDb().collection("shelves").document(shelfId).set(shelf).get();
        return ResponseEntity.ok(shelf);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> renameShelf(@PathVariable String id, @RequestBody Map<String, String> payload) throws ExecutionException, InterruptedException {
        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        firestoreService.getDb().collection("shelves").document(id).update("name", name).get();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShelf(@PathVariable String id) throws ExecutionException, InterruptedException {
        firestoreService.getDb().collection("shelves").document(id).delete().get();
        
        // Also remove shelf from all books' collections
        var books = firestoreService.getDb().collection("books").whereArrayContains("collections", id).get().get().getDocuments();
        for (var doc : books) {
            List<String> collections = (List<String>) doc.get("collections");
            if (collections != null) {
                collections.remove(id);
                doc.getReference().update("collections", collections).get();
            }
        }
        
        return ResponseEntity.ok(Map.of("message", "Shelf deleted"));
    }

    @PutMapping("/reorder")
    public ResponseEntity<?> reorderShelves(@RequestBody Map<String, List<String>> payload) throws ExecutionException, InterruptedException {
        List<String> orderedIds = payload.get("orderedIds");
        if (orderedIds == null) return ResponseEntity.badRequest().build();

        var batch = firestoreService.getDb().batch();
        for (int i = 0; i < orderedIds.size(); i++) {
            var ref = firestoreService.getDb().collection("shelves").document(orderedIds.get(i));
            batch.update(ref, "order", i);
        }
        batch.commit().get();

        return ResponseEntity.ok(Map.of("success", true));
    }
}
