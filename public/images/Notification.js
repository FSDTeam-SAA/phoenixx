const CommentIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4 h16 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-12 l-4 4 v-4 h-2 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z" fill="#0001FB" />
        <circle cx="8" cy="11" r="1" fill="white" />
        <circle cx="12" cy="11" r="1" fill="white" />
        <circle cx="16" cy="11" r="1" fill="white" />
      </svg>
    </>
  )
}



const LikeIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21 c-1 -1 -9 -8 -9 -12.5 a4 4 0 0 1 8 -1 a4 4 0 0 1 8 1 c0 4.5 -8 11.5 -9 12.5 z" fill="#0001FB" />
      </svg>
    </>
  )
}


const FollowIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" fill="#0001FB" />
        <path d="M6 18 a6 6 0 0 1 12 0 v2 h-12 v-2 z" fill="#0001FB" />
        <circle cx="18" cy="6" r="3" fill="#0001FB" />
        <rect x="16.5" y="9" width="3" height="1.5" fill="#0001FB" />
      </svg>
    </>
  )
}


const ErrorIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#0001FB" />
        <path d="M8 8 l8 8 m0 -8 l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  )
}

const SuccessIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#0001FB" />
        <path d="M8 12 l3 3 l5 -6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </>
  )
}

const InfoIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#0001FB" />
        <circle cx="12" cy="8" r="1" fill="white" />
        <rect x="11" y="11" width="2" height="6" fill="white" rx="1" />
      </svg>
    </>
  )
}

const PostIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" fill="#0001FB" rx="2" />
        <rect x="6" y="7" width="12" height="1.5" fill="white" rx="0.5" />
        <rect x="6" y="10" width="8" height="1.5" fill="white" rx="0.5" />
        <rect x="6" y="13" width="10" height="1.5" fill="white" rx="0.5" />
        <rect x="6" y="16" width="6" height="1.5" fill="white" rx="0.5" />
      </svg>
    </>
  )
}

const ReplyIcon = () => {
  return (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 7 l-4 4 l4 4 m-3 -4 h10 a4 4 0 0 1 4 4 v6" stroke="#0001FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </>
  )
}


const PublicPost = () => {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="35" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
      <path d="M25 35 L40 20 L55 35 M40 20 L40 60" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  )
}

const NewFollow = () => {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="64" cy="64" r="60" fill="#0001FB" />
      <path d="M64 40C55.16 40 48 47.16 48 56C48 64.84 55.16 72 64 72C72.84 72 80 64.84 80 56C80 47.16 72.84 40 64 40Z" fill="#0001FB" />
      <path d="M52 76C41 76 32 85 32 96V98C32 100.2 33.8 102 36 102H92C94.2 102 96 100.2 96 98V96C96 85 87 76 76 76H52Z" fill="#0001FB" />

      <path d="M100 36C97.8 36 96 37.8 96 40C96 42.2 97.8 44 100 44C102.2 44 104 42.2 104 40C104 37.8 102.2 36 100 36Z" fill="#0001FB" />
      <path d="M104 48H96C93.8 48 92 49.8 92 52V56C92 58.2 93.8 60 96 60H104C106.2 60 108 58.2 108 56V52C108 49.8 106.2 48 104 48Z" fill="#0001FB" />

      <path d="M80 60L92 48" stroke="white" stroke-width="4" stroke-linecap="round" />
    </svg>
  )
}


export { CommentIcon, ErrorIcon, FollowIcon, InfoIcon, LikeIcon, NewFollow, PostIcon, PublicPost, ReplyIcon, SuccessIcon }






