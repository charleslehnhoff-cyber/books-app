package com.sphaerus.books.services;

import com.sphaerus.books.models.Book;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class BookService {

    @Autowired private FirestoreService firestoreService;
    @Autowired private StorageService storageService;
    @Autowired private GoogleBooksService googleBooksService;
    @Autowired private PdfService pdfService;
    @Autowired private EpubService epubService;
    @Autowired private AsyncCoverExtractor asyncCoverExtractor;

    public Book uploadBook(MultipartFile file, String providedTitle) throws Exception {
        String bookId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        
        String ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        String fileName = bookId + ext;
        String gcsFileName = "pdfs/" + fileName;

        Book book = new Book();
        book.setId(bookId);
        
        byte[] fileBytes = file.getBytes();
        
        String rawTitle = originalName.replaceAll("\\.(?i)(pdf|epub)$", "");
        String cleanTitle = rawTitle.replaceAll("[-_\\.]", " ");
        cleanTitle = cleanTitle.replaceAll("(?i)\\b(pdf|sample|issue|vol)\\b", "");
        cleanTitle = cleanTitle.replaceAll("([a-z])([A-Z]+)", "$1 $2");
        cleanTitle = cleanTitle.trim().replaceAll("\\s+", " ");
        
        book.setTitle(providedTitle != null ? providedTitle : cleanTitle);
        book.setAuthor("Unknown Author");
        book.setFilename(fileName);
        book.setOriginalName(originalName);
        book.setUploadDate(Instant.now().toString());

        // Extract metadata if EPUB
        if (ext.equals(".epub")) {
            try {
                Map<String, String> epubMeta = epubService.extractMetadata(fileBytes);
                if (epubMeta.containsKey("title")) book.setTitle(epubMeta.get("title"));
                if (epubMeta.containsKey("author")) book.setAuthor(epubMeta.get("author"));
            } catch (Exception ex) {
                System.err.println("Failed to extract EPUB metadata: " + ex.getMessage());
            }
        }
        
        // Extract metadata if PDF
        if (ext.equals(".pdf")) {
            try {
                Map<String, String> pdfMeta = pdfService.extractMetadata(new ByteArrayInputStream(fileBytes));
                if (pdfMeta.containsKey("title")) book.setTitle(pdfMeta.get("title"));
                if (pdfMeta.containsKey("author")) book.setAuthor(pdfMeta.get("author"));
            } catch (Exception ex) {
                System.err.println("Failed to extract PDF metadata: " + ex.getMessage());
            }
        }

        // Start Cover Extraction asynchronously
        asyncCoverExtractor.extractAndSaveCoverAsync(book, fileBytes, ext);
        boolean hasCover = false; // Initially false, will be set async

        // Google Books metadata
        Map<String, String> gBooksMeta = googleBooksService.fetchMetadata(book.getTitle());
        if (gBooksMeta.containsKey("author") && book.getAuthor().equals("Unknown Author")) {
            book.setAuthor(gBooksMeta.get("author"));
        }
        if (gBooksMeta.containsKey("description")) book.setDescription(gBooksMeta.get("description"));
        if (!hasCover && gBooksMeta.containsKey("coverUrl")) {
            book.setCoverUrl(gBooksMeta.get("coverUrl"));
        }

        // Upload to GCS
        storageService.uploadFile(gcsFileName, new ByteArrayInputStream(fileBytes), file.getContentType());

        // Save to Firestore
        firestoreService.getDb().collection("books").document(bookId).set(book).get();

        return book;
    }
    
    public void deleteBook(String id) throws ExecutionException, InterruptedException {
        var doc = firestoreService.getDb().collection("books").document(id).get().get();
        if (doc.exists()) {
            Book book = doc.toObject(Book.class);
            storageService.deleteFile("pdfs/" + book.getFilename());
            if (book.getCover() != null) {
                storageService.deleteFile("covers/" + book.getCover());
            }
            firestoreService.getDb().collection("books").document(id).delete().get();
        } else {
            throw new IllegalArgumentException("Book not found");
        }
    }
}
