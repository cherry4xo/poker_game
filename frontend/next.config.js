/** @type {import('next').NextConfig} */

// const withPWA = require('next-pwa')({
//     dest: 'public',
//     disable: process.env.NODE_ENV === 'development'
// });

// module.exports = withPWA({
//     experimental: {
//         scrollRestoration: true
//     },
//     reactStrictMode: false,
//     images: {
//         remotePatterns: [
//             {
//                 protocol: 'https',
//                 hostname: 'storage.twodev.cc'
//             }
//         ]
//     }
// })

module.exports = {
    output: 'standalone',
    reactStrictMode: false
}