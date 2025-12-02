import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateAssetSchema = z.object({
  type: z.string().optional(),
  symbol: z.string().optional(),
  quantity: z.number().min(0).optional(),
  purchasePrice: z.number().positive().optional(),
  currentPrice: z.number().min(0).optional(),
  date: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/user/assets/[id] called')
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id } = await params
  console.log('Asset ID:', id)

  try {
    const body = await request.json()
    console.log('Request body:', body)
    const data = updateAssetSchema.parse(body)

    // First, get the current asset to calculate new total value
    const currentAsset = await prisma.asset.findUnique({
      where: { id: id, userId: decoded.userId }
    })

    if (!currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Calculate new total value
    const quantity = data.quantity ?? currentAsset.quantity
    const currentPrice = data.currentPrice ?? currentAsset.currentPrice ?? currentAsset.purchasePrice
    const totalValue = quantity && currentPrice ? quantity * currentPrice : currentAsset.purchasePrice

    const updatedAsset = await prisma.asset.update({
      where: { id: id, userId: decoded.userId },
      data: {
        ...data,
        totalValue: totalValue,
        date: data.date ? new Date(data.date) : undefined,
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json({ asset: updatedAsset })
  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json({ error: 'Failed to update asset', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = verifyToken(token) as { userId: string } | null
  if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.asset.delete({
      where: { id: id, userId: decoded.userId }
    })

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}