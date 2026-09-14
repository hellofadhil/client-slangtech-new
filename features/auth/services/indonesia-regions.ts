export type IndonesiaRegion = {
  id: string
  name: string
}

const regionCache = new Map<string, Promise<IndonesiaRegion[]>>()

async function fetchRegions(cacheKey: string, url: string) {
  const cachedRegions = regionCache.get(cacheKey)

  if (cachedRegions) {
    return cachedRegions
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Data wilayah belum bisa dimuat.")
      }

      return (await response.json()) as IndonesiaRegion[]
    })
    .catch((error) => {
      regionCache.delete(cacheKey)
      throw error
    })

  regionCache.set(cacheKey, request)
  return request
}

export function getProvinces() {
  return fetchRegions("provinces", "/api/regions?type=provinces")
}

export function getRegencies(provinceId: string) {
  return fetchRegions(
    `regencies:${provinceId}`,
    `/api/regions?type=regencies&parentId=${encodeURIComponent(provinceId)}`,
  )
}

export function getDistricts(regencyId: string) {
  return fetchRegions(
    `districts:${regencyId}`,
    `/api/regions?type=districts&parentId=${encodeURIComponent(regencyId)}`,
  )
}

export function getVillages(districtId: string) {
  return fetchRegions(
    `villages:${districtId}`,
    `/api/regions?type=villages&parentId=${encodeURIComponent(districtId)}`,
  )
}
