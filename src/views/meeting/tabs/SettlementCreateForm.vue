<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { avatarColorForId } from '../../../utils/avatar'
import type { Participant } from '../../../types/meeting'
import type { CreateSettlementRequest } from '../../../types/settlement'

const props = defineProps<{
  participants: Participant[]
  currentUserId: number
}>()

const emit = defineEmits<{
  cancel: []
  submit: [data: CreateSettlementRequest]
}>()

// --- Step 1 ---
const title = ref('')
const method = ref<'TOTAL' | 'ITEMIZED'>('TOTAL')

// --- Step 2-A: N빵 ---
const totalRaw = ref(0)
const totalDisplay = ref('')
const selectedIds = ref(new Set<number>())

function onTotalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const digits = input.value.replace(/[^0-9]/g, '')
  totalRaw.value = Number(digits) || 0
  const formatted = totalRaw.value ? totalRaw.value.toLocaleString('ko-KR') : ''
  totalDisplay.value = formatted
  nextTick(() => { input.value = formatted })
}

function toggleParticipant(id: number) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// Others = participants excluding me (creator is always included)
const others = computed(() => props.participants.filter((p) => p.id !== props.currentUserId))

// Headcount includes creator
const headcount = computed(() => selectedIds.value.size + 1)
const perPersonBase = computed(() =>
  headcount.value > 0 ? Math.floor(totalRaw.value / headcount.value) : 0,
)
const totalRemainder = computed(() =>
  headcount.value > 0 ? totalRaw.value % headcount.value : 0,
)
const creatorAmount = computed(() => perPersonBase.value + totalRemainder.value)

// --- Step 2-B: 항목별 ---
interface ItemForm {
  id: string
  name: string
  raw: number
  display: string
  participantIds: Set<number>
}

const items = ref<ItemForm[]>([
  { id: 'i0', name: '', raw: 0, display: '', participantIds: new Set() },
])

function addItem() {
  items.value.push({ id: `i${Date.now()}`, name: '', raw: 0, display: '', participantIds: new Set() })
}

function removeItem(id: string) {
  if (items.value.length > 1) {
    items.value = items.value.filter((it) => it.id !== id)
  }
}

function onItemAmountInput(id: string, e: Event) {
  const input = e.target as HTMLInputElement
  const digits = input.value.replace(/[^0-9]/g, '')
  const num = Number(digits) || 0
  const formatted = num ? num.toLocaleString('ko-KR') : ''
  const idx = items.value.findIndex((it) => it.id === id)
  if (idx !== -1) {
    items.value[idx]!.raw = num
    items.value[idx]!.display = formatted
  }
  nextTick(() => { input.value = formatted })
}

function toggleItemParticipant(itemId: string, participantId: number) {
  const idx = items.value.findIndex((it) => it.id === itemId)
  if (idx === -1) return
  const next = new Set(items.value[idx]!.participantIds)
  if (next.has(participantId)) next.delete(participantId)
  else next.add(participantId)
  items.value[idx]!.participantIds = next
}

// Per-participant totals for ITEMIZED preview (백엔드 동일 규칙: floor + 나머지는 creator 흡수)
const perPersonItemized = computed<Record<number, number>>(() => {
  const totals: Record<number, number> = {}
  for (const item of items.value) {
    if (item.raw > 0 && item.participantIds.size > 0) {
      const ids = [...item.participantIds]
      const base = Math.floor(item.raw / ids.length)
      const r = item.raw % ids.length
      const creatorIn = item.participantIds.has(props.currentUserId)
      const sorted = [...ids].sort((a, b) => a - b)
      for (const id of ids) {
        const extra = creatorIn
          ? (id === props.currentUserId ? r : 0)
          : (sorted.indexOf(id) < r ? 1 : 0)
        totals[id] = (totals[id] ?? 0) + base + extra
      }
    }
  }
  return totals
})

const itemizedPreviewRows = computed(() =>
  Object.entries(perPersonItemized.value).map(([id, amount]) => {
    const participant = props.participants.find((p) => p.id === Number(id))
    return { id: Number(id), nickname: participant?.nickname ?? '참여자', amount }
  }),
)

// --- Step 3: 계좌 ---
const bankName = ref('')
const accountNumber = ref('')
const accountHolder = ref('')

// --- Validation ---
const isValid = computed(() => {
  if (!title.value.trim() || !bankName.value.trim() || !accountNumber.value.trim() || !accountHolder.value.trim()) return false
  if (method.value === 'TOTAL') return totalRaw.value > 0 && (others.value.length === 0 || selectedIds.value.size > 0)
  return items.value.some((it) => it.name.trim() && it.raw > 0 && it.participantIds.size > 0)
})

function onSubmit() {
  if (!isValid.value) return
  const base = {
    title: title.value.trim(),
    bankName: bankName.value.trim(),
    accountNumber: accountNumber.value.trim(),
    accountHolder: accountHolder.value.trim(),
  }
  if (method.value === 'TOTAL') {
    emit('submit', {
      ...base,
      type: 'TOTAL',
      totalAmount: totalRaw.value,
      participantUserIds: [props.currentUserId, ...Array.from(selectedIds.value)],
    })
  } else {
    emit('submit', {
      ...base,
      type: 'ITEMIZED',
      items: items.value
        .filter((it) => it.name.trim() && it.raw > 0 && it.participantIds.size > 0)
        .map((it) => ({
          name: it.name.trim(),
          amount: it.raw,
          participantUserIds: Array.from(it.participantIds),
        })),
    })
  }
}

function wonFormat(n: number) {
  return n.toLocaleString('ko-KR')
}

function initial(nickname: string) {
  return nickname.charAt(0)
}
</script>

<template>
  <div class="scf">
    <!-- Header -->
    <div class="scf__header">
      <button class="scf__back-btn" aria-label="뒤로" @click="emit('cancel')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3l-5 5 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h2 class="scf__title">정산 추가하기</h2>
    </div>

    <!-- Section 1: 기본 정보 -->
    <div class="scf__section">
      <div class="scf__section-head">
        <span class="scf__step-badge">1</span>
        <span class="scf__section-title">기본 정보</span>
      </div>

      <div class="scf__field">
        <label class="scf__label">정산 제목 <span class="scf__required">*</span></label>
        <input
          v-model="title"
          class="scf__input"
          placeholder="예) 1차 식사, 택시비"
          maxlength="50"
        />
      </div>

      <div class="scf__field">
        <label class="scf__label">정산 방식 <span class="scf__required">*</span></label>
        <div class="scf__method-toggle">
          <button
            class="scf__method-opt"
            :class="{ 'scf__method-opt--active': method === 'TOTAL' }"
            @click="method = 'TOTAL'"
          >
            <div class="scf__method-opt-top">
              <span class="scf__method-opt-label">총액 1/N 정산</span>
              <span class="scf__method-radio" :class="{ 'scf__method-radio--active': method === 'TOTAL' }">
                <span v-if="method === 'TOTAL'" class="scf__method-radio-dot" />
              </span>
            </div>
            <div class="scf__method-opt-desc">똑같이 나눠요</div>
          </button>
          <button
            class="scf__method-opt"
            :class="{ 'scf__method-opt--active': method === 'ITEMIZED' }"
            @click="method = 'ITEMIZED'"
          >
            <div class="scf__method-opt-top">
              <span class="scf__method-opt-label">항목별 정산</span>
              <span class="scf__method-radio" :class="{ 'scf__method-radio--active': method === 'ITEMIZED' }">
                <span v-if="method === 'ITEMIZED'" class="scf__method-radio-dot" />
              </span>
            </div>
            <div class="scf__method-opt-desc">먹은 만큼 나눠요</div>
          </button>
        </div>
      </div>
    </div>

    <!-- Section 2-A: N빵 -->
    <div v-if="method === 'TOTAL'" class="scf__section">
      <div class="scf__section-head">
        <span class="scf__step-badge">2</span>
        <span class="scf__section-title">총액 1/N 정산</span>
      </div>

      <div class="scf__field">
        <label class="scf__label">총 금액 <span class="scf__required">*</span></label>
        <div class="scf__input-wrap">
          <input
            class="scf__input"
            :value="totalDisplay"
            inputmode="numeric"
            placeholder="0"
            @input="onTotalInput"
          />
          <span class="scf__suffix">원</span>
        </div>
      </div>

      <div v-if="others.length > 0" class="scf__field">
        <label class="scf__label">함께 낼 사람 <span class="scf__required">*</span></label>
        <p class="scf__hint">나를 포함해 정산 인원이 계산돼요</p>
        <div class="scf__participant-chips">
          <button
            v-for="p in others"
            :key="p.id"
            class="scf__chip"
            :class="{ 'scf__chip--active': selectedIds.has(p.id) }"
            @click="toggleParticipant(p.id)"
          >
            <span
              class="scf__chip-avatar"
              :style="{
                background: selectedIds.has(p.id) ? avatarColorForId(p.id) : '#EFEFF3',
                color: selectedIds.has(p.id) ? '#fff' : '#9A9AA3',
              }"
            >{{ initial(p.nickname) }}</span>
            <span class="scf__chip-name">{{ p.nickname }}</span>
          </button>
        </div>
      </div>
      <p v-else class="scf__hint scf__hint--solo">나 혼자 결제한 내역이에요</p>

      <!-- 1인당 미리보기 -->
      <div v-if="totalRaw > 0 && (selectedIds.size > 0 || others.length === 0)" class="scf__preview">
        <div class="scf__preview-sub">{{ wonFormat(totalRaw) }}원 ÷ {{ headcount }}명</div>
        <div class="scf__preview-highlight">1인당 {{ wonFormat(perPersonBase) }}원</div>
        <div v-if="totalRemainder > 0" class="scf__preview-creator-note">
          정산자(나) {{ wonFormat(creatorAmount) }}원
        </div>
      </div>
    </div>

    <!-- Section 2-B: 항목별 -->
    <div v-else class="scf__section">
      <div class="scf__section-head">
        <span class="scf__step-badge">2</span>
        <span class="scf__section-title">항목별 정산</span>
      </div>

      <div class="scf__items">
        <div v-for="(item, idx) in items" :key="item.id" class="scf__item-card">
          <div class="scf__item-head">
            <span class="scf__item-index">항목 {{ idx + 1 }}</span>
            <button
              v-if="items.length > 1"
              class="scf__item-remove"
              aria-label="항목 삭제"
              @click="removeItem(item.id)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="scf__item-inputs">
            <input
              v-model="item.name"
              class="scf__input scf__input--flex"
              placeholder="항목명 (예: 안주)"
            />
            <div class="scf__input-wrap scf__input-wrap--narrow">
              <input
                class="scf__input"
                :value="item.display"
                inputmode="numeric"
                placeholder="0"
                @input="onItemAmountInput(item.id, $event)"
              />
              <span class="scf__suffix">원</span>
            </div>
          </div>

          <!-- 참여자 체크박스 -->
          <div class="scf__participant-chips">
            <button
              v-for="p in participants"
              :key="p.id"
              class="scf__chip"
              :class="{ 'scf__chip--active': item.participantIds.has(p.id) }"
              @click="toggleItemParticipant(item.id, p.id)"
            >
              <span
                class="scf__chip-avatar"
                :style="{
                  background: item.participantIds.has(p.id) ? avatarColorForId(p.id) : '#EFEFF3',
                  color: item.participantIds.has(p.id) ? '#fff' : '#9A9AA3',
                }"
              >{{ initial(p.nickname) }}</span>
              <span class="scf__chip-name">{{ p.nickname }}</span>
            </button>
          </div>
        </div>
      </div>

      <button class="scf__add-item-btn" @click="addItem">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        항목 추가
      </button>

      <!-- 참여자별 합산 미리보기 -->
      <div v-if="itemizedPreviewRows.length > 0" class="scf__preview scf__preview--table">
        <div class="scf__preview-table-title">참여자별 최종 금액</div>
        <div class="scf__preview-table-rows">
          <div v-for="row in itemizedPreviewRows" :key="row.id" class="scf__preview-table-row">
            <span class="scf__preview-table-name">{{ row.nickname }}</span>
            <span class="scf__preview-table-amount">{{ wonFormat(row.amount) }}원</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: 계좌 -->
    <div class="scf__section">
      <div class="scf__section-head">
        <span class="scf__step-badge">3</span>
        <span class="scf__section-title">받을 계좌</span>
      </div>

      <div class="scf__row-fields">
        <div class="scf__field scf__field--bank">
          <label class="scf__label">은행 <span class="scf__required">*</span></label>
          <input v-model="bankName" class="scf__input" placeholder="토스뱅크" />
        </div>
        <div class="scf__field scf__field--holder">
          <label class="scf__label">예금주 <span class="scf__required">*</span></label>
          <input v-model="accountHolder" class="scf__input" placeholder="김민지" />
        </div>
      </div>

      <div class="scf__field">
        <label class="scf__label">계좌번호 <span class="scf__required">*</span></label>
        <input
          v-model="accountNumber"
          class="scf__input"
          placeholder="1000-1234-5678"
          inputmode="numeric"
        />
      </div>
    </div>

    <!-- CTA -->
    <div class="scf__actions">
      <button class="scf__cancel-btn" @click="emit('cancel')">취소</button>
      <button
        class="scf__submit-btn"
        :class="{ 'scf__submit-btn--active': isValid }"
        :disabled="!isValid"
        @click="onSubmit"
      >
        정산 만들기
      </button>
    </div>
  </div>
</template>

<style scoped>
.scf {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.scf__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.scf__back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  margin-left: -6px;
  transition: background 0.1s;
}
.scf__back-btn:hover { background: var(--color-bg-secondary); }
.scf__title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
}

/* Section */
.scf__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.scf__section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.scf__step-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}
.scf__section-title {
  font-size: 14.5px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

/* Fields */
.scf__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.scf__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.scf__required { color: var(--color-primary); margin-left: 2px; }
.scf__hint {
  margin: -3px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.scf__hint--solo {
  margin: 0;
  padding: 10px 13px;
  background: var(--color-bg-secondary);
  border-radius: 9px;
}

/* Input */
.scf__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 13px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14.5px;
  font-family: inherit;
  color: var(--color-text-primary);
  letter-spacing: -0.005em;
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.scf__input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(83, 74, 183, 0.08);
}
.scf__input::placeholder { color: var(--color-text-placeholder); }

.scf__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.scf__input-wrap .scf__input { padding-right: 36px; }
.scf__suffix {
  position: absolute;
  right: 13px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  pointer-events: none;
}

/* Row fields */
.scf__row-fields {
  display: flex;
  gap: 8px;
}
.scf__field--bank { flex: 0 0 40%; min-width: 0; }
.scf__field--holder { flex: 1; min-width: 0; }

/* Method toggle */
.scf__method-toggle {
  display: flex;
  gap: 8px;
}
.scf__method-opt {
  flex: 1;
  padding: 12px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 11px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 0.12s, background 0.12s;
}
.scf__method-opt--active {
  background: rgba(83, 74, 183, 0.06);
  border-color: var(--color-primary);
}
.scf__method-opt-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}
.scf__method-opt-label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.scf__method-opt--active .scf__method-opt-label { color: var(--color-primary); }
.scf__method-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #D5D5DC;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.scf__method-radio--active {
  border-color: var(--color-primary);
  background: var(--color-primary);
}
.scf__method-radio-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}
.scf__method-opt-desc {
  font-size: 11.5px;
  color: var(--color-text-secondary);
}

/* Participant chips */
.scf__participant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.scf__chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 6px;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.12s, background 0.12s;
}
.scf__chip--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.scf__chip-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.scf__chip-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.scf__chip--active .scf__chip-name { color: #fff; }

/* Preview */
.scf__preview {
  background: rgba(83, 74, 183, 0.05);
  border: 1px solid rgba(83, 74, 183, 0.15);
  border-radius: 12px;
  padding: 13px 15px;
  text-align: center;
}
.scf__preview-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}
.scf__preview-highlight {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.03em;
}
.scf__preview-creator-note {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.scf__preview--table {
  text-align: left;
}
.scf__preview-table-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}
.scf__preview-table-rows {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.scf__preview-table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.scf__preview-table-name {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}
.scf__preview-table-amount {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.01em;
}

/* Item card */
.scf__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.scf__item-card {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scf__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.scf__item-index {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.scf__item-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-placeholder);
  border-radius: 6px;
  transition: background 0.1s;
}
.scf__item-remove:hover { background: rgba(0, 0, 0, 0.06); }
.scf__item-inputs {
  display: flex;
  gap: 8px;
}
.scf__input--flex { flex: 1; min-width: 0; }
.scf__input-wrap--narrow { flex: 0 0 42%; min-width: 0; }

.scf__add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px;
  background: #fff;
  border: 1.5px dashed var(--color-border);
  border-radius: 10px;
  color: var(--color-primary);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.1s, border-color 0.1s;
}
.scf__add-item-btn:hover {
  background: rgba(83, 74, 183, 0.04);
  border-color: var(--color-primary);
}

/* CTA */
.scf__actions {
  display: flex;
  gap: 8px;
}
.scf__cancel-btn {
  flex: 0 0 auto;
  padding: 13px 18px;
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 11px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.1s;
}
.scf__cancel-btn:hover { background: var(--color-bg-secondary); }
.scf__submit-btn {
  flex: 1;
  padding: 13px 18px;
  background: #C9C6E4;
  color: #fff;
  border: none;
  border-radius: 11px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: not-allowed;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: background 0.12s, box-shadow 0.12s;
}
.scf__submit-btn--active {
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(83, 74, 183, 0.20);
}
.scf__submit-btn--active:hover {
  background: #4540a0;
}
</style>
