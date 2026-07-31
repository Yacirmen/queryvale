import type { LessonLearningContent, LessonTask } from "../types/lesson";

export type LearningContentTaskSource = Pick<
  LessonTask,
  | "id"
  | "title"
  | "objective"
  | "scenario"
  | "concepts"
  | "expectedColumns"
  | "orderSensitive"
  | "explanation"
  | "completionMessage"
>;

const humanizeConcept = (concept: string): string =>
  concept.replaceAll("_", " ");

const formatList = (values: readonly string[]): string => {
  if (values.length === 0) return "tanımlı çıktı alanı";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} ve ${values.at(-1)}`;
};

/**
 * Produces complete coaching content for newly authored tasks. Hand-written
 * entries may override this fallback, but consumers can always rely on the
 * same LessonLearningContent contract. The generated text describes checks
 * and reasoning; it never assembles or reveals a solution query.
 */
export const createDefaultLearningContent = (
  task: LearningContentTaskSource,
): LessonLearningContent => {
  const columns = formatList(task.expectedColumns);
  const grainKey = task.expectedColumns[0] ?? "çıktı anahtarı";
  const concepts = formatList(task.concepts.map(humanizeConcept));
  const orderRule = task.orderSensitive
    ? "Görevde istenen satır sırası sonuç sözleşmesinin bir parçasıdır."
    : "Bu görevde satır sırası değerlendirilmez; doğru satır kümesine odaklanılır.";
  const orderCheck = task.orderSensitive
    ? "Sonuç satırlarını görev hedefinde belirtilen öncelik ve yönde karşılaştır."
    : "Yalnızca görünüm sırası farklıysa, doğru satır kümesini değiştirmeye çalışma.";

  return {
    learningBrief: {
      conceptAnchor: `${task.title} görevinde aktarılabilir fikir, ${concepts} kavramlarını iş hedefindeki veri tanesine uygun biçimde birlikte kullanmaktır.`,
      outputGrain: `Her sonuç satırı ${grainKey} alanıyla tanımlanan tek bir karar birimini temsil eder; hesap ve filtreler bu taneyi korumalıdır.`,
      acceptanceChecks: [
        `Çıktı sözleşmesi ${columns} kolonlarını tam olarak bu sırada içermeli.`,
        `Dönen satırlar görev hedefindeki koşulları karşılamalı: ${task.objective}`,
        task.orderSensitive
          ? "Satırların sırası, görevde belirtilen iş önceliğiyle birebir uyuşmalı."
          : "Satır sırası serbest olsa da eksik, fazla veya yinelenmiş satır bulunmamalı.",
      ],
      dataNotes: [
        `${orderRule} Sonucu kontrol ederken NULL, tekrar eden değer ve veri tipi farklılıklarının satır tanesini nasıl etkilediğini ayrıca düşün.`,
      ],
    },
    coaching: {
      "columns-wrong": {
        title: `${task.title}: çıktı kolonlarını sözleşmeyle hizala`,
        checks: [
          `Sonuçta yalnızca ${columns} kolonlarının bulunduğunu kontrol et.`,
          "Kolon adlarını, alias'ları ve soldan sağa sıralarını beklenen çıktı listesiyle karşılaştır.",
        ],
      },
      "rows-wrong": {
        title: `${task.title}: satır tanesini ve iş koşullarını yeniden denetle`,
        checks: [
          `Her satırın şu hedefe hizmet ettiğini doğrula: ${task.objective}`,
          "Filtre, birleştirme, toplulaştırma veya tekilleştirme adımlarından birinin satır eksiltip çoğaltmadığını küçük örnekler üzerinde kontrol et.",
        ],
      },
      "order-wrong": {
        title: `${task.title}: sonuç sırası politikasını uygula`,
        checks: [
          orderCheck,
          task.orderSensitive
            ? "Eşit değerler oluşabiliyorsa deterministik sonuç için görev tanesine uygun ikinci bir sıralama anahtarı gerekip gerekmediğini düşün."
            : "Kolon sırasıyla satır sırasını birbirinden ayır; kolon sözleşmesi yine de zorunludur.",
        ],
      },
      "required-concept-missing": {
        title: `${task.title}: hedeflenen SQL yaklaşımını görünür kıl`,
        checks: [
          `Çözüm yaklaşımında ${concepts} kavramlarının görevde amaçlanan rolü üstlendiğini doğrula.`,
          "Doğru sonucu tesadüfen üreten bir kısayol yerine, başka veri setlerine de taşınabilecek açık ve okunur yaklaşımı kullan.",
        ],
      },
      "execution-error": {
        title: `${task.title}: sorguyu küçük parçalarda doğrula`,
        checks: [
          `Şemadaki tablo ve kolon adlarını, özellikle ${columns} çıktı alanlarının kaynaklarını tekrar kontrol et.`,
          "Parantezleri, virgülleri, metin sabitlerini ve SQL bölümlerinin sırasını gözden geçir; ardından yaklaşımı en küçük çalışan parçadan başlayarak genişlet.",
        ],
      },
    },
    debrief: {
      steps: [
        `İş talebini satır tanesi, çıktı kolonları ve kabul koşulları olarak ayır: ${task.objective}`,
        `${concepts} kavramlarını yalnızca üstlendikleri veri seçme, dönüştürme veya ilişkilendirme rolünde uygula.`,
        `${columns} kolonlarını, satır kümesini ve sıra politikasını birbirinden bağımsız kontrollerle doğrula.`,
      ],
      whyItWorks: `${task.explanation} Bu yaklaşım, “${task.scenario}” senaryosundaki iş kuralını sonuç şekli ve satır tanesiyle aynı hizada tutar.`,
      edgeCases: [
        "Kaynak kolonlarda NULL veya boş değer bulunduğunda filtre, hesap ve eşleşme davranışının iş kuralına uygun olup olmadığını kontrol et.",
        "Eşit sıralama değerleri, yinelenen anahtarlar veya beklenmedik çoktan-çoğa ilişkiler oluştuğunda satır sayısının değişebileceğini test et.",
      ],
      workplaceImpact: `${task.completionMessage} Aynı kontrol disiplini, üretim raporlarında yanlış kolon sözleşmesi ve sessiz satır kaybı riskini azaltır.`,
      transfer: {
        prompt: `Aynı ${concepts} yaklaşımını farklı bir veri setine taşısaydın, “${task.objective}” hedefindeki hangi satır tanesi ve kabul koşullarını yeniden tanımlaman gerekirdi?`,
        reveal:
          "Tablo ve kolon adları değişse de önce bir satırın neyi temsil ettiğini, sonra doğru kolonları, satır koşullarını ve sıra politikasını tanımlarsın; SQL yapısını bu sözleşmeden sonra seçersin.",
      },
    },
  };
};

export default createDefaultLearningContent;
