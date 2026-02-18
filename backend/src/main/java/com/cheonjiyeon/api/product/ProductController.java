package com.cheonjiyeon.api.product;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/cash")
    public ProductDtos.ProductListResponse listCashProducts() {
        List<ProductEntity> products = productService.listActiveProducts();
        return new ProductDtos.ProductListResponse(
                products.stream()
                        .map(ProductDtos.ProductResponse::from)
                        .toList()
        );
    }
}
