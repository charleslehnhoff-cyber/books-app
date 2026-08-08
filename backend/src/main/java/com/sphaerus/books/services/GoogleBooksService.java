package com.sphaerus.books.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoogleBooksService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, String> fetchMetadata(String title) {
        Map<String, String> metadata = new HashMap<>();
        try {
            String query = URLEncoder.encode("intitle:" + title, StandardCharsets.UTF_8.toString());
            String url = "https://www.googleapis.com/books/v1/volumes?q=" + query;
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("items")) {
                List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
                if (!items.isEmpty()) {
                    Map<String, Object> volumeInfo = (Map<String, Object>) items.get(0).get("volumeInfo");
                    if (volumeInfo != null) {
                        if (volumeInfo.containsKey("authors")) {
                            List<String> authors = (List<String>) volumeInfo.get("authors");
                            if (!authors.isEmpty()) {
                                metadata.put("author", authors.get(0));
                            }
                        }
                        if (volumeInfo.containsKey("description")) {
                            metadata.put("description", (String) volumeInfo.get("description"));
                        }
                        if (volumeInfo.containsKey("imageLinks")) {
                            Map<String, String> imageLinks = (Map<String, String>) volumeInfo.get("imageLinks");
                            if (imageLinks.containsKey("thumbnail")) {
                                String coverUrl = imageLinks.get("thumbnail")
                                    .replace("zoom=1", "zoom=0")
                                    .replace("edge=curl", "")
                                    .replace("http:", "https:");
                                metadata.put("coverUrl", coverUrl);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Google Books API error: " + e.getMessage());
        }
        return metadata;
    }
}
