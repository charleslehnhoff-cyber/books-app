package com.sphaerus.books.services;

import org.springframework.stereotype.Service;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class EpubService {

    public Map<String, String> extractMetadata(byte[] epubBytes) {
        Map<String, String> metadata = new HashMap<>();
        try {
            String opfContent = getOpfContent(epubBytes);
            if (opfContent != null) {
                // Extract title
                Matcher titleMatcher = Pattern.compile("<dc:title[^>]*>(.*?)</dc:title>", Pattern.DOTALL).matcher(opfContent);
                if (titleMatcher.find()) {
                    metadata.put("title", titleMatcher.group(1).trim());
                }
                
                // Extract author
                Matcher authorMatcher = Pattern.compile("<dc:creator[^>]*>(.*?)</dc:creator>", Pattern.DOTALL).matcher(opfContent);
                if (authorMatcher.find()) {
                    metadata.put("author", authorMatcher.group(1).trim());
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting EPUB metadata: " + e.getMessage());
        }
        return metadata;
    }

    public byte[] extractCover(byte[] epubBytes) {
        try {
            String opfContent = getOpfContent(epubBytes);
            if (opfContent != null) {
                String coverId = null;
                // Look for <meta name="cover" content="cover-image-id"/>
                Matcher metaMatcher = Pattern.compile("<meta[^>]*name=[\"']cover[\"'][^>]*content=[\"'](.*?)[\"'][^>]*>").matcher(opfContent);
                if (metaMatcher.find()) {
                    coverId = metaMatcher.group(1);
                }

                String coverHref = null;
                if (coverId != null) {
                    // Look for <item id="cover-image-id" href="Images/cover.jpg" media-type="image/jpeg"/>
                    Matcher itemMatcher = Pattern.compile("<item[^>]*id=[\"']" + Pattern.quote(coverId) + "[\"'][^>]*href=[\"'](.*?)[\"']").matcher(opfContent);
                    if (itemMatcher.find()) {
                        coverHref = itemMatcher.group(1);
                    }
                }

                // Fallback: look for href containing "cover" and ending in jpg/png
                if (coverHref == null) {
                    Matcher fallbackMatcher = Pattern.compile("<item[^>]*href=[\"']([^\"']*(?:cover|front)[^\"']*(?:\\.jpg|\\.jpeg|\\.png))[\"']", Pattern.CASE_INSENSITIVE).matcher(opfContent);
                    if (fallbackMatcher.find()) {
                        coverHref = fallbackMatcher.group(1);
                    }
                }

                if (coverHref != null) {
                    String opfPath = getOpfPath(epubBytes);
                    String basePath = opfPath.contains("/") ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : "";
                    String fullCoverPath = basePath + coverHref;
                    
                    // Now read the zip again and find this entry
                    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(epubBytes))) {
                        ZipEntry entry;
                        while ((entry = zis.getNextEntry()) != null) {
                            if (entry.getName().equals(fullCoverPath) || entry.getName().endsWith(coverHref)) {
                                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                byte[] buffer = new byte[1024];
                                int len;
                                while ((len = zis.read(buffer)) > 0) {
                                    baos.write(buffer, 0, len);
                                }
                                return baos.toByteArray();
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting EPUB cover: " + e.getMessage());
        }
        return null;
    }

    private String getOpfContent(byte[] epubBytes) throws Exception {
        String opfPath = getOpfPath(epubBytes);
        if (opfPath != null) {
            try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(epubBytes))) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    if (entry.getName().equals(opfPath)) {
                        return readStringFromZip(zis);
                    }
                }
            }
        }
        return null;
    }

    private String getOpfPath(byte[] epubBytes) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(epubBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.getName().equals("META-INF/container.xml")) {
                    String containerContent = readStringFromZip(zis);
                    Matcher m = Pattern.compile("full-path=[\"'](.*?)[\"']").matcher(containerContent);
                    if (m.find()) {
                        return m.group(1);
                    }
                }
            }
        }
        return null;
    }

    private String readStringFromZip(ZipInputStream zis) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int len;
        while ((len = zis.read(buffer)) > 0) {
            baos.write(buffer, 0, len);
        }
        return new String(baos.toByteArray(), "UTF-8");
    }
}
