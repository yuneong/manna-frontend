import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Meeting } from '../types/meeting'

export const useMeetingStore = defineStore('meeting', () => {
  const currentMeeting = ref<Meeting | null>(null)

  function setCurrentMeeting(meeting: Meeting) {
    currentMeeting.value = meeting
  }

  function clearCurrentMeeting() {
    currentMeeting.value = null
  }

  return { currentMeeting, setCurrentMeeting, clearCurrentMeeting }
})
