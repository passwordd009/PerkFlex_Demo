import type { Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from './auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Max distance in km a customer can be from the business district boundary */
const MAX_DISTANCE_KM = 50

export async function districtMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const { businessId, customerLat, customerLng } = req.body as {
    businessId?: string
    customerLat?: number
    customerLng?: number
  }

  if (!businessId) {
    next()
    return
  }

  // Get the business and its district
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, district_id, lat, lng, districts(id, name, boundary)')
    .eq('id', businessId)
    .single()

  if (error || !business) {
    res.status(404).json({ message: 'Business not found' })
    return
  }

  // If business has no district assigned, allow any order
  if (!business.district_id) {
    next()
    return
  }

  // If customer location is provided, check they're in range
  if (customerLat !== undefined && customerLng !== undefined) {
    const { data: inDistrict } = await supabase.rpc('is_point_in_district', {
      p_lat: customerLat,
      p_lng: customerLng,
      p_district_id: business.district_id,
    })

    if (!inDistrict) {
      res.status(403).json({
        message: `Orders from this business are restricted to the ${(business as any).districts?.name || 'local'} district`,
        code: 'OUT_OF_DISTRICT',
      })
      return
    }
  }

  next()
}
