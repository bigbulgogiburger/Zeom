package com.cheonjiyeon.api.product;

import java.util.List;

public class ProductDtos {
    public record ProductResponse(
            Long id,
            String name,
            String description,
            Integer minutes,
            Long cashAmount,
            Long priceKrw
    ) {
        public static ProductResponse from(ProductEntity product) {
            return new ProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getDescription(),
                    product.getMinutes(),
                    product.getCashAmount(),
                    product.getPriceKrw()
            );
        }
    }

    public record ProductListResponse(List<ProductResponse> products) {}
}
