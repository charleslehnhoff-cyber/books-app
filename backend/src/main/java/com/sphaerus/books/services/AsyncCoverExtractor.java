package com.sphaerus.books.services;

import com.sphaerus.books.models.Book;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;

@Service
public class AsyncCoverExtractor {

    @Autowired private PdfService pdfService;
    @Autowired private EpubService epubService;
    @Autowired private StorageService storageService;
    @Autowired private FirestoreService firestoreService;

    @Async
    public void extractAndSaveCoverAsync(Book book, byte[] fileBytes, String ext) {
        try {
            boolean coverExtracted = false;
            
            if (ext.equals(".pdf")) {
                byte[] coverBytes = pdfService.extractCover(new ByteArrayInputStream(fileBytes));
                if (coverBytes != null) {
                    String coverName = book.getId() + ".png";
                    storageService.uploadBytes("covers/" + coverName, coverBytes, "image/png");
                    book.setCover(coverName);
                    book.setCoverUrl("/api/books/" + book.getId() + "/cover");
                    coverExtracted = true;
                }
            } else if (ext.equals(".epub")) {
                byte[] coverBytes = epubService.extractCover(fileBytes);
                if (coverBytes != null) {
                    String coverName = book.getId() + ".png";
                    storageService.uploadBytes("covers/" + coverName, coverBytes, "image/jpeg");
                    book.setCover(coverName);
                    book.setCoverUrl("/api/books/" + book.getId() + "/cover");
                    coverExtracted = true;
                }
            }

            if (coverExtracted) {
                // Update Firestore with the new cover details
                firestoreService.getDb().collection("books").document(book.getId())
                        .update("cover", book.getCover(), "coverUrl", book.getCoverUrl()).get();
            }
        } catch (Exception e) {
            System.err.println("Failed to extract cover asynchronously for book " + book.getId() + ": " + e.getMessage());
        }
    }
}
