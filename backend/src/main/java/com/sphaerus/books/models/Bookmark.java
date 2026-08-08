package com.sphaerus.books.models;

import lombok.Data;

@Data
public class Bookmark {
    private String id;
    private String name;
    private String cfi;
    private Integer page;
}
