package com.sphaerus.books.models;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class Book {
    private String id;
    private String title;
    private String author;
    private String filename;
    private String originalName;
    private String uploadDate;
    private String cover;
    private String coverUrl;
    private String description;
    private Integer currentPage = 1;
    private Integer totalPages = 0;
    private String lastOpened;
    private List<String> collections = new ArrayList<>();
    private List<Highlight> highlights = new ArrayList<>();
    private List<Bookmark> bookmarks = new ArrayList<>();
}
