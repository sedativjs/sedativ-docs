export default req => {
  const cache = { duration: 0, maxSize: 1024 * 1024 } // 1MB default

  if (req.route === './index.html') cache.duration = 1000 * 60 * 60 * 24 // 1 day

  return cache
}