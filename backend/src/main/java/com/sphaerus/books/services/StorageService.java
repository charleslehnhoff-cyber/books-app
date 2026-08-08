package com.sphaerus.books.services;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.channels.Channels;
import java.util.Optional;

@Service
public class StorageService {
    private final Storage storage;
    
    @Value("${gcp.storage.bucket:sphaerus-intranet-new-books-data}")
    private String bucketName;

    public StorageService() {
        this.storage = StorageOptions.getDefaultInstance().getService();
    }

    public void uploadFile(String objectName, InputStream inputStream, String contentType) throws Exception {
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(contentType).build();
        storage.createFrom(blobInfo, inputStream);
    }
    
    public void uploadBytes(String objectName, byte[] bytes, String contentType) {
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(contentType).build();
        storage.create(blobInfo, bytes);
    }

    public Optional<Blob> getFile(String objectName) {
        BlobId blobId = BlobId.of(bucketName, objectName);
        Blob blob = storage.get(blobId);
        return Optional.ofNullable(blob);
    }
    
    public boolean deleteFile(String objectName) {
        BlobId blobId = BlobId.of(bucketName, objectName);
        return storage.delete(blobId);
    }
}
