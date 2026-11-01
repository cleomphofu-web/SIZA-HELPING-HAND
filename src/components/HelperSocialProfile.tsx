"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  MapPin,
  CheckCircle2,
  Camera,
  Edit3,
  Sparkles,
  Share2,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  PlusCircle,
  Briefcase,
  Star,
  ShieldCheck,
  Send,
} from "lucide-react";
import { updateHelperBio } from "@/app/(helper)/helper/profile/actions";
import { toast } from "sonner";

type HelperProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  suburbs: string[];
  services: string[];
  bio: string;
  status: string;
};

type Post = {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
  image?: string;
  likes: number;
  liked: boolean;
};

const initialPosts: Post[] = [
  {
    id: "post-1",
    author: "My Cleaning Portfolio",
    timeAgo: "Yesterday",
    content: "Deep clean completed in Rosebank today! Polished all kitchen countertops, descaled tile grout, and organized the pantry.",
    image: "/assets/images/hero/background%20home%20page%20hero.png",
    likes: 12,
    liked: false,
  },
  {
    id: "post-2",
    author: "My Cleaning Portfolio",
    timeAgo: "3 days ago",
    content: "Living room and bedroom turnover ready for new weekend guests. Fresh linen hospital folds and pristine mirrors! ✨",
    likes: 8,
    liked: true,
  },
];

export function HelperSocialProfile({ profile }: { profile: HelperProfileData }) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profile.bio || "");
  const [isPending, startTransition] = useTransition();

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostText, setNewPostText] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleSaveBio = () => {
    startTransition(async () => {
      try {
        await updateHelperBio(bioText);
        setIsEditingBio(false);
        toast.success("Profile bio updated successfully!");
      } catch {
        toast.error("Could not update bio. Try again.");
      }
    });
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: `${profile.firstName} ${profile.lastName}`,
      timeAgo: "Just now",
      content: newPostText.trim(),
      likes: 0,
      liked: false,
    };
    setPosts([newPost, ...posts]);
    setNewPostText("");
    toast.success("Post shared to your profile!");
  };

  const handleToggleLike = (postId: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            liked: !p.liked,
            likes: p.liked ? p.likes - 1 : p.likes + 1,
          };
        }
        return p;
      })
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      toast.success("Profile picture updated!");
    }
  };

  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/helper"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Profile
            </span>
          </div>
          <Link
            href="/helper"
            className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
        {/* Cover & Profile Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm">
          {/* Header Cover Banner */}
          <div className="relative h-44 sm:h-52 bg-gradient-to-r from-neutral-900 via-stone-800 to-neutral-900 overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium border border-white/15">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Verified Helper
              </span>
            </div>
          </div>

          {/* Profile Header Details */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar with Upload */}
              <div className="relative group size-28 sm:size-32 rounded-3xl bg-neutral-900 text-white flex items-center justify-center font-bold text-3xl border-4 border-white shadow-xl overflow-hidden">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs gap-1"
                >
                  <Camera className="size-5" />
                  <span>Update</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:self-end">
                <button
                  type="button"
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-800 transition-colors shadow-sm"
                >
                  <Edit3 className="size-3.5" />
                  <span>{isEditingBio ? "Close Bio Editor" : "Edit Bio"}</span>
                </button>
                <Link
                  href="/helper/account"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Account Settings
                </Link>
              </div>
            </div>

            {/* Name & Job Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <CheckCircle2 className="size-5 text-emerald-600 fill-emerald-100" />
              </div>
              <p className="text-sm font-medium text-neutral-600">
                {profile.jobTitle || "Professional Home & Commercial Helper"}
              </p>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-neutral-400" />
                  Johannesburg ({profile.suburbs?.length || 0} suburbs)
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  5.0 Rating (Top rated)
                </span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-neutral-100">
              <div className="text-center p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <p className="text-xl font-bold text-neutral-900">100%</p>
                <p className="text-xs text-neutral-500 font-medium">On-time Arrival</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <p className="text-xl font-bold text-neutral-900">{profile.services?.length || 5}</p>
                <p className="text-xs text-neutral-500 font-medium">Services Offered</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-neutral-50 border border-neutral-100">
                <p className="text-xl font-bold text-neutral-900">Active</p>
                <p className="text-xs text-neutral-500 font-medium">Fair Rotation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <User className="size-4 text-neutral-600" />
              About Me & Bio
            </h2>
            {!isEditingBio && (
              <button
                type="button"
                onClick={() => setIsEditingBio(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="space-y-3">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={4}
                maxLength={800}
                placeholder="Share a short description about yourself, your cleaning background, and what makes your work stand out..."
                className="w-full p-4 rounded-2xl border border-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none text-sm text-neutral-900 placeholder:text-neutral-400 resize-none transition-all"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {bioText.length}/800 characters
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBioText(profile.bio || "");
                      setIsEditingBio(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBio}
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Bio"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-700 leading-relaxed font-normal">
              {profile.bio || "No bio added yet. Click 'Edit' to introduce yourself to hosts and highlight your experience."}
            </p>
          )}
        </div>

        {/* Services & Suburbs Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Services */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.services?.length ? (
                profile.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold capitalize"
                  >
                    {service.replace(/_/g, " ")}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-500">All standard domestic services</span>
              )}
            </div>
          </div>

          {/* Suburbs */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="size-4 text-emerald-600" />
              Suburbs Covered
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.suburbs?.length ? (
                profile.suburbs.map((suburb, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-semibold"
                  >
                    {suburb}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-500">Johannesburg areas</span>
              )}
            </div>
          </div>
        </div>

        {/* Social Feed: Share Photos & Work Updates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-neutral-900">
              Work Showcase & Activity
            </h2>
            <span className="text-xs text-neutral-500">
              Share updates & photos of your cleanings
            </span>
          </div>

          {/* Create Post Card */}
          <form
            onSubmit={handleAddPost}
            className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Share a work update or showcase a clean you completed..."
                rows={2}
                className="w-full p-3 rounded-2xl border border-neutral-200 focus:border-black outline-none text-sm text-neutral-900 placeholder:text-neutral-400 resize-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <label
                htmlFor="post-image"
                className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer px-3 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                <ImageIcon className="size-4 text-emerald-600" />
                <span>Add Photo</span>
                <input
                  id="post-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => toast.info("Photo attached to post")}
                />
              </label>

              <button
                type="submit"
                disabled={!newPostText.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <Send className="size-3.5" />
                <span>Post Update</span>
              </button>
            </div>
          </form>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        {profile.firstName} {profile.lastName}
                      </p>
                      <p className="text-xs text-neutral-400">{post.timeAgo}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Post link copied to clipboard")}
                    className="text-neutral-400 hover:text-black p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>

                <p className="text-sm text-neutral-800 leading-relaxed font-normal">
                  {post.content}
                </p>

                {post.image && (
                  <div className="relative h-60 sm:h-72 w-full rounded-2xl overflow-hidden border border-neutral-100">
                    <Image
                      src={post.image}
                      alt="Work showcase"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      post.liked ? "text-rose-600" : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <Heart className={`size-4 ${post.liked ? "fill-rose-600" : ""}`} />
                    <span>{post.likes} {post.likes === 1 ? "Like" : "Likes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info("Feedback feature active for verified hosts")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
                  >
                    <MessageSquare className="size-4" />
                    <span>Host Feedback</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

