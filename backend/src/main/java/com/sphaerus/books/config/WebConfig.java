package com.sphaerus.books.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward SPA routes to their corresponding Next.js static HTML files
        registry.addViewController("/read").setViewName("forward:/read.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cache Next.js static assets for 1 year (Immutable)
        registry.addResourceHandler("/_next/static/**")
                .addResourceLocations("classpath:/static/_next/static/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());

        // Cache Next.js public assets, fonts, icons, CSS
        registry.addResourceHandler("/fonts/**", "/*.css", "/*.js", "/favicon.ico", "/*.svg", "/*.woff2")
                .addResourceLocations("classpath:/static/fonts/", "classpath:/static/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
                
        // Default handler for HTML files (no-cache so we always get the latest index.html / read.html)
        registry.addResourceHandler("/*.html")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache());
    }
}
