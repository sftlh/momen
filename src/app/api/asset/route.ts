import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const assetSchema = z.object({
  type: z.string(),
  symbol: z.string().optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive(),
  currentPrice: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const body = await request.json()
    const data = assetSchema.parse(body)

    // Calculate total value: quantity * currentPrice, or quantity * purchasePrice if no currentPrice
    const totalValue = data.quantity
      ? (data.currentPrice || data.purchasePrice) * data.quantity
      : data.purchasePrice

    await prisma.asset.create({
      data: {
        type: data.type,
        symbol: data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        totalValue: totalValue,
        description: data.description,
        userId: decoded.userId,
        date: data.date ? new Date(data.date) : undefined,
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json({ message: 'Asset added' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, currentPrice } = body

    if (!id || !currentPrice) {
      return NextResponse.json({ error: 'Asset ID and current price required' }, { status: 400 })
    }

    // Get the asset to calculate new total value
    const asset = await prisma.asset.findUnique({
      where: { id, userId: decoded.userId }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const newTotalValue = asset.quantity
      ? currentPrice * asset.quantity
      : currentPrice

    // Update asset with new price and total value
    await prisma.asset.update({
      where: { id },
      data: {
        currentPrice: currentPrice,
        totalValue: newTotalValue,
        lastUpdated: new Date()
      }
    })

    // Add price history entry
    await prisma.assetPriceHistory.create({
      data: {
        assetId: id,
        price: currentPrice,
        date: new Date()
      }
    })

    return NextResponse.json({ message: 'Asset price updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update asset price' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const data = assetSchema.parse(body)

    // Verify the asset belongs to the user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 })
    }

    // Calculate total value: quantity * currentPrice, or quantity * purchasePrice if no currentPrice
    const totalValue = data.quantity
      ? (data.currentPrice || data.purchasePrice) * data.quantity
      : data.purchasePrice

    await prisma.asset.update({
      where: { id: id },
      data: {
        type: data.type,
        symbol: data.symbol,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        totalValue: totalValue,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json({ message: 'Asset updated successfully' })
  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    // Verify the asset belongs to the user
    const asset = await prisma.asset.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 })
    }

    // Delete associated price history first
    await prisma.assetPriceHistory.deleteMany({
      where: { assetId: id }
    })

    // Then delete the asset
    await prisma.asset.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}