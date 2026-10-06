import { Compass, MapPin, Wallet } from 'lucide-react'
import SocialShareActions from '../components/SocialShareActions.jsx'

const highlights = [
  { icon: MapPin, title: 'বাংলাদেশের ৬৪ জেলা', description: 'জেলা পরিচিতি, দর্শনীয় স্থান, খাবার ও ভ্রমণের তথ্য।' },
  { icon: Compass, title: 'সহজ ভ্রমণ পরিকল্পনা', description: 'গন্তব্য, দিন ও ভ্রমণকারীর সংখ্যা দিয়ে রুট ও বাজেটের ধারণা।' },
  { icon: Wallet, title: 'দৈনন্দিন হিসাব-নিকাশ', description: 'জীবনের প্রয়োজনীয় খরচ বুঝতে ব্যবহারযোগ্য বিভিন্ন টুল।' },
]

export default function AboutPage() {
  return (
    <section className="page-shell about-page">
      <header className="page-heading">
        <span className="eyebrow">DESHMATE · বাংলাদেশ আপনার হাতের মুঠোয়</span>
        <h1>আমাদের <span>সম্পর্কে</span></h1>
        <p>বাংলাদেশকে জানা এবং জীবনের প্রয়োজনীয় হিসাবকে আরও সহজ করে তোলাই আমাদের লক্ষ্য।</p>
      </header>

      <article className="about-story">
        <div className="about-story-heading">
          <span className="brand-mark"><Compass size={23} /></span>
          <div><strong>DeshMate</strong><span>বাংলাদেশকে জানুন, জীবনের হিসাব করুন।</span></div>
        </div>
        <div className="about-copy">
          <p><strong>DeshMate</strong> হলো বাংলাদেশের মানুষ ও বাংলাদেশকে নতুনভাবে জানার জন্য তৈরি একটি সহজ, আধুনিক ও ব্যবহারবান্ধব ডিজিটাল প্ল্যাটফর্ম।</p>
          <p>বাংলাদেশের <strong>৬৪ জেলা</strong>, ভ্রমণ পরিকল্পনা, প্রয়োজনীয় হিসাব-নিকাশ এবং দৈনন্দিন জীবনে কাজে লাগে—এমন বিভিন্ন তথ্য ও টুলকে একটি জায়গায় নিয়ে আসাই DeshMate-এর মূল লক্ষ্য।</p>
          <p>আপনি কোথায় যেতে চান, কতদিন থাকতে চান, কতজন যাবেন কিংবা আনুমানিক কত খরচ হতে পারে—এসব হিসাব সহজভাবে বুঝতে DeshMate আপনাকে সাহায্য করবে।</p>
          <p>আমাদের লক্ষ্য শুধু তথ্য দেওয়া নয়; বরং <strong>বাংলাদেশকে জানা এবং জীবনের প্রয়োজনীয় হিসাবকে আরও সহজ করে তোলা।</strong></p>
        </div>
      </article>

      <div className="about-highlight-grid">
        {highlights.map(({ icon: Icon, title, description }) => (
          <article className="about-highlight" key={title}>
            <span className="feature-icon"><Icon size={20} /></span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <section className="about-share-panel">
        <div className="about-share-copy">
          <span className="eyebrow">বন্ধুদের সঙ্গে ভাগ করে নিন</span>
          <h2>DeshMate ছড়িয়ে দিন</h2>
          <p>Facebook-এ ওয়েবসাইটের লিংক শেয়ার করুন, অথবা নাম ও credit-সহ তৈরি ছবিটি Instagram-এ পোস্ট করুন।</p>
        </div>
        <SocialShareActions />
      </section>
    </section>
  )
}
