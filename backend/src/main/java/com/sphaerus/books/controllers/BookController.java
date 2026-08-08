package com.sphaerus.books.controllers;

import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.sphaerus.books.models.Book;
import com.sphaerus.books.services.BookService;
import com.sphaerus.books.services.FirestoreService;
import com.sphaerus.books.services.StorageService;
import com.sphaerus.books.services.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.ByteArrayInputStream;
import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*") // Update in prod
public class BookController {

    @Autowired private FirestoreService firestoreService;
    @Autowired private StorageService storageService;
    @Autowired private PdfService pdfService;
    @Autowired private BookService bookService;

    @GetMapping
    public List<Book> getAllBooks(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String lastDate) throws ExecutionException, InterruptedException {
        List<Book> books = new ArrayList<>();
        var query = firestoreService.getDb().collection("books")
                .orderBy("uploadDate", com.google.cloud.firestore.Query.Direction.DESCENDING);
        
        if (lastDate != null && !lastDate.isEmpty()) {
            query = query.startAfter(lastDate);
        }
        
        if (limit != null && limit > 0) {
            query = query.limit(limit);
        } else {
            query = query.limit(50); // Safe default for unpaginated legacy clients
        }
        
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            books.add(document.toObject(Book.class));
        }
        return books;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBook(@PathVariable String id) throws ExecutionException, InterruptedException {
        var doc = firestoreService.getDb().collection("books").document(id).get().get();
        if (doc.exists()) {
            return ResponseEntity.ok(doc.toObject(Book.class));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadBook(@PathVariable String id) throws ExecutionException, InterruptedException {
        var doc = firestoreService.getDb().collection("books").document(id).get().get();
        if (doc.exists()) {
            Book book = doc.toObject(Book.class);
            var blobOpt = storageService.getFile("pdfs/" + book.getFilename());
            if (blobOpt.isPresent()) {
                var blob = blobOpt.get();
                byte[] content = blob.getContent();
                ByteArrayResource resource = new ByteArrayResource(content);
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + book.getOriginalName() + "\"");
                if (book.getFilename() != null && book.getFilename().toLowerCase().endsWith(".epub")) {
                    headers.setContentType(MediaType.valueOf("application/epub+zip"));
                } else {
                    headers.setContentType(MediaType.APPLICATION_PDF);
                }
                
                return ResponseEntity
                        .ok()
                        .headers(headers)
                        .contentLength(content.length)
                        .body(resource);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/cover")
    public ResponseEntity<Resource> downloadCover(@PathVariable String id) throws ExecutionException, InterruptedException {
        var doc = firestoreService.getDb().collection("books").document(id).get().get();
        if (doc.exists()) {
            Book book = doc.toObject(Book.class);
            if (book.getCover() != null) {
                var blobOpt = storageService.getFile("covers/" + book.getCover());
                if (blobOpt.isPresent()) {
                    var blob = blobOpt.get();
                    byte[] content = blob.getContent();
                    ByteArrayResource resource = new ByteArrayResource(content);
                    HttpHeaders headers = new HttpHeaders();
                    if (book.getCover().toLowerCase().endsWith(".png")) {
                        headers.setContentType(MediaType.IMAGE_PNG);
                    } else {
                        headers.setContentType(MediaType.IMAGE_JPEG);
                    }
                    return ResponseEntity.ok().headers(headers).contentLength(content.length).body(resource);
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadBook(@RequestParam("pdf") MultipartFile file, 
                                        @RequestParam(value = "title", required = false) String title) {
        try {
            Book book = bookService.uploadBook(file, title);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Upload successful", "book", book));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable String id) {
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok(Map.of("message", "Book deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBook(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            Map<String, Object> finalUpdates = new HashMap<>();
            if (updates.containsKey("title")) finalUpdates.put("title", ((String)updates.get("title")).trim());
            if (updates.containsKey("author")) finalUpdates.put("author", ((String)updates.get("author")).trim());
            if (updates.containsKey("collections")) finalUpdates.put("collections", updates.get("collections"));
            if (updates.containsKey("coverUrl")) finalUpdates.put("coverUrl", ((String)updates.get("coverUrl")).trim());
            if (updates.containsKey("highlights")) finalUpdates.put("highlights", updates.get("highlights"));

            if (!finalUpdates.isEmpty()) {
                firestoreService.getDb().collection("books").document(id).update(finalUpdates).get();
            }
            return ResponseEntity.ok(Map.of("message", "Book metadata updated"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Additional endpoints for user progress, highlights, and bookmarks would go here.
}
