import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import configPromise from '../../../../payload.config'
import { ProductClient } from './ProductClient'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    limit: 100,
    overrideAccess: false,
  })

  return products.docs.map(({ slug }) => ({ slug }))
}

export default async function ProductPage({ params: { slug } }: { params: { slug: string } }) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    draft: true, // Allow drafts for live preview
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const product = result.docs[0]

  if (!product) {
    return notFound()
  }

  return <ProductClient initialProduct={product as any} />
}
