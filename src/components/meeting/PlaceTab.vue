<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePlaces, useSuggestPlace, useVotePlace } from '../../composables/useMeeting'
import PlaceCard from './PlaceCard.vue'
import PlaceSuggestForm from './PlaceSuggestForm.vue'
import PlaceEmptyState from './PlaceEmptyState.vue'
import type { Place } from '../../types/meeting'

const props = defineProps<{
  meetingId: number
  totalParticipants: number
}>()

const emit = defineEmits<{
  toast: [msg: string]
}>()

const { data: places, isLoading, error } = usePlaces(props.meetingId)
const { mutate: suggestPlace, isPending: isSuggesting } = useSuggestPlace(props.meetingId)
const { mutate: votePlace } = useVotePlace(props.meetingId)
const votingIds = ref(new Set<number>())

const formRef = ref<InstanceType<typeof PlaceSuggestForm> | null>(null)

watch(error, (e: any) => {
  if (e?.response?.status === 403) emit('toast', '권한이 없어요')
})

const totalParticipants = computed(
  () => places.value?.totalParticipants ?? props.totalParticipants,
)

const sortedPlaces = computed<Place[]>(() => {
  if (!Array.isArray(places.value?.places)) return []
  return [...places.value.places].sort((a, b) => b.voteCount - a.voteCount)
})

const maxVotes = computed(() =>
  sortedPlaces.value.length > 0 ? sortedPlaces.value[0]!.voteCount : 0,
)

const leaderCount = computed(() =>
  maxVotes.value > 0
    ? sortedPlaces.value.filter((p) => p.voteCount === maxVotes.value).length
    : 0,
)

function isLeader(place: Place): boolean {
  return leaderCount.value === 1 && place.voteCount === maxVotes.value && maxVotes.value > 0
}

function isCoLeader(place: Place): boolean {
  return leaderCount.value > 1 && place.voteCount === maxVotes.value && maxVotes.value > 0
}

function onSuggest(payload: { name: string; url: string; memo: string }) {
  suggestPlace(
    {
      name: payload.name,
      url: payload.url || undefined,
      memo: payload.memo || undefined,
    },
    {
      onSuccess: () => formRef.value?.reset(),
      onError: (e: any) => {
        const status = e?.response?.status
        if (status === 403) emit('toast', '권한이 없어요')
        else emit('toast', '장소 제안에 실패했어요.')
      },
    },
  )
}

function onVote(placeId: number) {
  votingIds.value = new Set([...votingIds.value, placeId])
  votePlace(placeId, {
    onSettled: () => {
      const next = new Set(votingIds.value)
      next.delete(placeId)
      votingIds.value = next
    },
    onError: (e: any) => {
      if (e?.response?.status === 403) emit('toast', '권한이 없어요')
      else emit('toast', '투표에 실패했어요.')
    },
  })
}
</script>

<template>
  <div class="place-tab">
    <!-- Header -->
    <div class="place-tab__header">
      <div class="place-tab__header-left">
        <div class="place-tab__title">어디서 만날까요?</div>
        <div class="place-tab__sub">마음에 드는 장소에 좋아요를 눌러주세요 · 여러 곳에 투표할 수 있어요</div>
      </div>
      <div v-if="sortedPlaces.length > 0" class="place-tab__count-badge">
        장소 {{ sortedPlaces.length }}개 제안됨
      </div>
    </div>

    <div v-if="isLoading" class="place-tab__loading">불러오는 중...</div>

    <!-- Empty state -->
    <template v-else-if="!sortedPlaces.length">
      <PlaceEmptyState />
      <PlaceSuggestForm
        ref="formRef"
        :is-pending="isSuggesting"
        :always-open="true"
        @submit="onSuggest"
      />
    </template>

    <!-- Has places -->
    <template v-else>
      <div class="place-list">
        <PlaceCard
          v-for="place in sortedPlaces"
          :key="place.id"
          :place="place"
          :is-leader="isLeader(place)"
          :is-co-leader="isCoLeader(place)"
          :total-participants="totalParticipants"

          :is-voting="votingIds.has(place.id)"
          @vote="onVote(place.id)"
        />
      </div>
      <PlaceSuggestForm
        ref="formRef"
        :is-pending="isSuggesting"
        @submit="onSuggest"
      />
    </template>
  </div>
</template>

<style scoped>
.place-tab {
  padding-top: 4px;
}
.place-tab__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.place-tab__header-left { flex: 1; min-width: 0; }
.place-tab__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
.place-tab__sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 3px;
}
.place-tab__count-badge {
  padding: 6px 12px;
  background: rgba(83, 74, 183, 0.10);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}
.place-tab__loading {
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}
.place-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
</style>
