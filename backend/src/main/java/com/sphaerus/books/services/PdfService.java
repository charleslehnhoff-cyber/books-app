package com.sphaerus.books.services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.HashMap;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;

@Service
public class PdfService {

    public byte[] extractCover(InputStream pdfStream) throws Exception {
        try (PDDocument document = PDDocument.load(pdfStream)) {
            if (document.getNumberOfPages() > 0) {
                PDFRenderer pdfRenderer = new PDFRenderer(document);
                // Render the first page (page 0) at 72 DPI
                BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 72, org.apache.pdfbox.rendering.ImageType.RGB);
                
                BufferedImage rgbImage = new BufferedImage(bim.getWidth(), bim.getHeight(), BufferedImage.TYPE_INT_RGB);
                java.awt.Graphics2D g = rgbImage.createGraphics();
                g.setColor(java.awt.Color.WHITE);
                g.fillRect(0, 0, rgbImage.getWidth(), rgbImage.getHeight());
                g.drawImage(bim, 0, 0, null);
                g.dispose();
                
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.setUseCache(false);
                ImageIO.write(rgbImage, "png", baos);
                return baos.toByteArray();
            }
            return null;
        }
    }

    public Map<String, String> extractMetadata(InputStream pdfStream) throws Exception {
        try (PDDocument document = PDDocument.load(pdfStream)) {
            Map<String, String> metadata = new HashMap<>();
            PDDocumentInformation info = document.getDocumentInformation();
            if (info != null) {
                if (info.getTitle() != null && !info.getTitle().trim().isEmpty()) {
                    metadata.put("title", info.getTitle().trim());
                }
                if (info.getAuthor() != null && !info.getAuthor().trim().isEmpty()) {
                    metadata.put("author", info.getAuthor().trim());
                }
            }
            return metadata;
        }
    }
}
