package com.cheonjiyeon.api.product;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductEntity> listActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    public ProductEntity findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "Product not found: " + id));
    }
}
