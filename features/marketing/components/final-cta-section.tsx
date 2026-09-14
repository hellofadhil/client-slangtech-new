// import Link from "next/link"
// import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react"

// const ctaBenefits = ["Tutor berpengalaman", "Jadwal fleksibel", "Progress terukur"]

// export function FinalCtaSection() {
//   return (
//     <section className="relative overflow-hidden bg-white px-5 py-16 md:px-6 md:py-24">
//       <div className="relative mx-auto max-w-6xl">
//         <div className="relative overflow-hidden rounded-[2rem] bg-[#032f1c] px-6 py-9 shadow-[0_32px_90px_rgba(3,47,28,0.24)] sm:px-8 sm:py-12 lg:px-14 lg:py-16">
//           <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
//           <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
//           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,255,90,0.16),transparent_38%)]" />

//           <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
//             <div>
//               <h2 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
//                 Bangun percaya diri berbicara Mandarin.
//               </h2>

//               <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/75 sm:text-lg sm:leading-8">
//                 Pilih kelas yang sesuai dengan tujuanmu, belajar dengan tutor yang tepat,
//                 dan ikuti proses belajar yang rapi dari awal sampai selesai.
//               </p>

//               <div className="mt-7 flex flex-wrap gap-2.5">
//                 {ctaBenefits.map((benefit) => (
//                   <span
//                     key={benefit}
//                     className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/90 backdrop-blur sm:text-sm"
//                   >
//                     <CheckCircle2 className="size-4 text-lime-300" />
//                     {benefit}
//                   </span>
//                 ))}
//               </div>

//               <div className="mt-8 flex flex-col gap-3 sm:flex-row">
//                 <Link
//                   href="#classes"
//                   className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#006B36] shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-lime-50"
//                 >
//                   Temukan Kelas Saya
//                   <ArrowRight className="size-4" />
//                 </Link>

//                 <Link
//                   href=""
//                   className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
//                 >
//                   <MessageCircle className="size-4" />
//                   Konsultasi Gratis
//                 </Link>
//               </div>
//             </div>

//             <div className="pointer-events-none hidden lg:block">
//               <div className="relative ml-auto h-[360px] max-w-[420px]">
//                 <div className="absolute right-0 top-0 h-56 w-56 rounded-[2rem] bg-white/10 backdrop-blur-xl" />
//                 <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-lime-300/20 blur-2xl" />
//                 <div className="absolute right-10 top-16 h-64 w-64 rounded-[3rem] border border-white/15 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl rotate-6" />
//                 <div className="absolute bottom-8 left-8 h-40 w-40 rounded-[2rem] border border-white/10 bg-white/[0.08] backdrop-blur-xl -rotate-6" />
//                 <div className="absolute right-24 bottom-10 h-24 w-24 rounded-full bg-lime-300/35 blur-xl" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }