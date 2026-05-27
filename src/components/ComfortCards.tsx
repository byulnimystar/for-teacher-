/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Coffee, Heart, Sparkles, Navigation, Layers } from "lucide-react";
import { motion } from "motion/react";
import { ComfortCard } from "../types";

const CARDS_POOL: ComfortCard[] = [
  {
    id: 1,
    category: "공감",
    content: "온갖 소란으로 가득 찬 교무실과 소란 가득한 교실 속에서도, 조용히 자기 자리를 지켜내신 것에 온 마음을 다해 눈물겨운 찬사를 보냅니다. 선생님, 오늘 정말 수고 많으셨습니다.",
    author: "어느 은퇴 교사의 응원 편지 중"
  },
  {
    id: 2,
    category: "쉼",
    content: "완벽한 소망이나 화려한 생기부 완성보다 훨씬 더 소중한 것은, 지금 선생님이 무리하지 않고 행복한 한 사람으로서 건강히 퇴근해 따뜻한 저녁 찌개를 즐기시는 것입니다.",
    author: "참스승 마음 치유 센터"
  },
  {
    id: 3,
    category: "용기",
    content: "비록 오늘 한 아이가 어긋난 눈빛을 보내 마음 아프셨을지라도, 결코 선생님의 사랑이 헛되지 않았습니다. 그 씨앗은 눈 속에 묻혀 조용히 자라며 10년 뒤 그 아이가 어른이 되었을 때 아련한 깨달음으로 등불이 될 거예요.",
    author: "교육 심리 아카이브"
  },
  {
    id: 4,
    category: "쉼",
    content: "내일 수업 준비물, 교재 연구, 해결 안 된 행정 공문은 고이 접고 문을 잠그세요. 학교 지갑은 서랍에 두고 왔으니, 선생님 본인의 순수한 마음만 데리고 오늘 밤은 푹 주무시길 권장합니다.",
    author: "마음 배달 우체통"
  },
  {
    id: 5,
    category: "공감",
    content: "학부모님의 떨리는 한마디나 무겁던 민원 앞에서 상처받은 마음은 비정상인 것이 아닙니다. 타인의 날카로운 소리에 부서질 만큼 진지하게 교직에 임해주셨다는 거룩한 흔적입니다. 이젠 자책을 멈추셔도 됩니다.",
    author: "따스미 마음 치유처"
  },
  {
    id: 6,
    category: "용기",
    content: "아이들이 오늘 선생님께 감사의 절이나 인사를 잊었을지언정, 그 영혼의 수첩 가장 깊은 곳엔 선생님의 부드러운 목소리와 따스한 눈빛이 세공되어 평생 보석처럼 빛날 것입니다.",
    author: "페스탈로치 명상록"
  },
  {
    id: 7,
    category: "위로",
    content: "잘하고 계십니다. 매일 출근하는 구두 굽 아래 박힌 흙처럼, 억수 같은 비바람 속에서도 물러서지 않고 다음 세대를 안아가시는 선생님이야말로 이 세상에서 가장 아늑하고 기품 있는 거목이십니다.",
    author: "생명 교육 네트워크"
  },
  {
    id: 8,
    category: "위로",
    content: "진정한 열정은 쉴 새 없이 타오르는 불빛이 아니라, 가끔 지쳐 흐릿해지더라도 다시 부드럽게 밝혀 줄 수 있는 불씨를 품는 일입니다. 오늘 잠시 숨이 죽은 나를 부디 다그치지 말고 온전히 사랑해 주세요.",
    author: "토닥토닥 교실 편지함"
  }
];

export default function ComfortCards() {
  const [selectedCard, setSelectedCard] = useState<ComfortCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardHistory, setCardHistory] = useState<ComfortCard[]>([]);

  const drawCard = () => {
    setIsFlipped(false);
    // Timeout to make sure flip is reset before showing the next card
    setTimeout(() => {
      const remainingCards = CARDS_POOL.filter(c => selectedCard ? c.id !== selectedCard.id : true);
      const randomIndex = Math.floor(Math.random() * remainingCards.length);
      const chosen = remainingCards[randomIndex] || CARDS_POOL[0];
      setSelectedCard(chosen);
      setIsFlipped(true);
      setCardHistory(prev => [chosen, ...prev.slice(0, 4)]);
    }, 150);
  };

  return (
    <div id="comfort-cards-section" className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
      <div className="w-full border-b border-stone-100 pb-3 mb-6 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Coffee className="text-amber-700 w-5 h-5" />
          오늘의 위로 한 장 차(Tea) 카드
        </h3>
        <span className="text-xs text-stone-500">따뜻한 위로 멘트 포춘쿠키 뽑아 마시기</span>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-center">
        {/* Left 3 cols: Card Flip display stage */}
        <div className="md:col-span-3 flex flex-col items-center py-6">
          <div className="h-[280px] w-full max-w-[360px] perspective-md relative">
            {selectedCard ? (
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full h-full cursor-pointer relative"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Side: Card Back aesthetic */}
                <div
                  style={{ backfaceVisibility: "hidden" }}
                  className="absolute inset-0 bg-gradient-to-tr from-amber-800 via-amber-850 to-emerald-900 rounded-2xl shadow-md p-6 flex flex-col justify-between items-center text-white border border-amber-700/30"
                >
                  <div className="w-full text-right opacity-30 text-[10px] font-mono tracking-wider">
                    CLASSTODAC CARD
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 animate-pulse">
                      <Sparkles className="w-6 h-6 text-amber-200" />
                    </div>
                    <span className="text-xs font-semibold text-amber-100 tracking-wide">
                      지친 당신을 위한 은은한 다도 타임
                    </span>
                    <p className="text-[10px] text-stone-200 font-medium bg-white/5 px-2.5 py-1 rounded-full">
                      카드를 뒤집어 오늘의 공감 귀인을 뽑아보세요
                    </p>
                  </div>
                  <div className="text-[10px] text-stone-300 font-medium">
                    클릭하면 이완과 치유의 뒤편이 나타납니다.
                  </div>
                </div>

                {/* Back Side: Real Content (rotated 180 deg) */}
                <div
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  className="absolute inset-0 bg-gradient-to-br from-stone-50 to-amber-50/10 rounded-2xl shadow-md p-6 flex flex-col justify-between border-2 border-amber-100"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-amber-100/40">
                    <span className="text-[10px] bg-amber-800 text-white font-bold px-2 py-0.5 rounded-full">
                      {selectedCard.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">NO.{selectedCard.id}</span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed font-sans font-medium text-center py-4 italic whitespace-pre-line">
                    " {selectedCard.content} "
                  </p>

                  <div className="text-right border-t border-amber-100/30 pt-2 flex items-center justify-end space-x-1">
                    <Heart className="w-3 h-3 text-amber-700 fill-amber-700" />
                    <span className="text-[9px] font-bold text-stone-550 italic">
                      - {selectedCard.author}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div
                onClick={drawCard}
                className="w-full h-full bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 cursor-pointer transition-all hover:border-amber-400 group"
              >
                <Coffee className="w-12 h-12 text-stone-300 group-hover:text-amber-700 transition-colors mb-2 animate-bounce" />
                <span className="text-xs font-semibold text-stone-600">오늘의 힐링 한모금 다원 카드 뽑기</span>
                <span className="text-[10px] text-stone-400 mt-1">이곳을 클릭하거나 아래 버튼을 눌러주세요</span>
              </div>
            )}
          </div>

          <button
            onClick={drawCard}
            className="mt-6 px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            {selectedCard ? "다른 카드 뽑아보기 (따스함 교두)" : "오늘의 행운 위로 카드 한 장 뽑기"}
          </button>
        </div>

        {/* Right 2 cols: Drawn history */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 pb-2 border-b border-stone-100">
            <Layers className="w-4 h-4 text-stone-500" />
            방금 우려낸 위로 카드 차들
          </h4>

          {cardHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              선생님께 따스한 찻잎 하나 띄워드릴 수 있게 카드를 한 번 뽑아보세요.
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cardHistory.map((historyItem, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedCard(historyItem);
                    setIsFlipped(true);
                  }}
                  className="text-left p-3 bg-stone-50 hover:bg-amber-100/20 border border-stone-150 rounded-lg cursor-pointer transition-all flex justify-between items-center"
                >
                  <div className="truncate flex-1 pr-4">
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm mr-2 inline-block">
                      {historyItem.category}
                    </span>
                    <span className="text-xs text-gray-750 line-clamp-1 italic font-sans">
                      "{historyItem.content}"
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium flex-shrink-0">
                    {historyItem.author.substring(0, 6)}...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
