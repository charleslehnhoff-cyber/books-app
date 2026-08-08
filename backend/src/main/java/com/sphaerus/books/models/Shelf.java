package com.sphaerus.books.models;

import lombok.Data;

@Data
public class Shelf {
    private String id;
    private String name;
    private String createdAt;
    private Integer order;
}
