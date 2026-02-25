'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'
import React, { useState } from 'react'

import type { Product } from '../../../../payload-types' // Adjust path if needed

export const ProductClient: React.FC<{ initialProduct: Product }> = ({ initialProduct }) => {
  const { data: product } = useLivePreview<Product>({
    initialData: initialProduct,
    serverURL: 'http://localhost:3000',
    depth: 1,
  })

  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes?.[0] || null
  )
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors?.[0] || null
  )
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const mockups = product.mockups || []
  const hasMockups = mockups.length > 0

  const nextSlide = () => {
    if (currentImageIndex < mockups.length - 1) {
      setCurrentImageIndex(curr => curr + 1)
    }
  }

  const prevSlide = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(curr => curr - 1)
    }
  }

  return (
    <div className="product-page">
      <div className="product-gallery">
        {hasMockups ? (
          <>
            <div 
              className="slider-track"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {mockups.map((mockup: any, index: number) => (
                <div key={index} className="slider-slide">
                  {mockup.url ? (
                    <img
                      src={mockup.url}
                      alt={`${product.name} - View ${index + 1}`}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#eee' }}>Image loading</div>
                  )}
                </div>
              ))}
            </div>
            
            {mockups.length > 1 && (
              <>
                <div className="slider-nav">
                  <button 
                    className="slider-btn prev" 
                    onClick={prevSlide}
                    disabled={currentImageIndex === 0}
                    aria-label="Previous image"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button 
                    className="slider-btn next" 
                    onClick={nextSlide}
                    disabled={currentImageIndex === mockups.length - 1}
                    aria-label="Next image"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
                
                <div className="slider-indicators">
                  {mockups.map((_: any, index: number) => (
                    <button
                      key={index}
                      className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f5f5f5' }}>
            <p style={{ color: 'var(--color-muted)' }}>No images available</p>
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-header">
          <h1>{product.name}</h1>
          <p className="product-price">${product.price?.toFixed(2) || '29.99'}</p>
        </div>

        <div className="product-options">
          {product.colors && product.colors.length > 0 && (
            <div className="option-group">
              <span className="option-label">Color</span>
              <div className="option-buttons">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className="option-btn"
                    data-selected={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="option-group">
              <span className="option-label">Size</span>
              <div className="option-buttons">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className="option-btn"
                    data-selected={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.fit && (
             <div className="option-group">
               <span className="option-label">Fit</span>
               <p style={{margin: 0, fontSize: '0.875rem'}}>{product.fit}</p>
             </div>
          )}
        </div>

        <button className="add-to-cart-btn">Add to Cart</button>

        {product.details && (
          <div className="product-details">
              <span className="option-label" style={{marginBottom: '1rem', display: 'block'}}>Details</span>
              <div className="product-details-content">
                 <RichText data={product.details as any} />
              </div>
          </div>
        )}
      </div>
    </div>
  )
}
