package com.sphaerus.books.models;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class UserProgress {
    private String userId;
    private Integer currentPage;
    private Integer totalPages;
    private String currentCfi;
    private String lastOpened;
    private List<Highlight> highlights = new ArrayList<>();
    private List<Bookmark> bookmarks = new ArrayList<>();
}
