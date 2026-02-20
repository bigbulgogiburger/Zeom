package com.cheonjiyeon.api.product;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Cacheable(value = "products", key = "'all'")
    public List<ProductEntity> listActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    @Cacheable(value = "products", key = "#id")
    public ProductEntity findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Product not found: " + id));
    }

    @CacheEvict(value = "products", allEntries = true)
    public void evictProductCaches() {
        // Cache eviction only — called when products are updated
    }
}
