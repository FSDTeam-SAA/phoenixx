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

export { CommentIcon, ErrorIcon, FollowIcon, InfoIcon, LikeIcon, PostIcon, ReplyIcon, SuccessIcon }






