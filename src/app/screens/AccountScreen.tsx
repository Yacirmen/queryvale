"use client";

import { ArrowRight, CheckCircle2, HardDrive, UserRound } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { validateProfileName } from "../../features/progress/progressStore";

type AccountTab = "login" | "signup";

interface AccountScreenProps {
  profileName: string;
  hasLocalAccount: boolean;
  profileActive: boolean;
  hasLearningProgress: boolean;
  completedCount: number;
  totalCount: number;
  resumeTaskTitle?: string;
  persistenceAvailable: boolean;
  writePending?: boolean;
  onCreateProfile: (name: string) => Promise<boolean>;
  onSignIn: () => Promise<boolean>;
  onContinue: () => void;
  onGuestContinue: () => void;
}

const accountTabs: readonly AccountTab[] = ["login", "signup"];

function profileInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
  return initials || "Q";
}

export function AccountScreen({
  profileName,
  hasLocalAccount,
  profileActive,
  hasLearningProgress,
  completedCount,
  totalCount,
  resumeTaskTitle,
  persistenceAvailable,
  writePending = false,
  onCreateProfile,
  onSignIn,
  onContinue,
  onGuestContinue,
}: AccountScreenProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>(
    hasLocalAccount ? "login" : "signup",
  );
  const [draftName, setDraftName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const instanceId = useId();
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const tabId = (tab: AccountTab) => `${instanceId}-${tab}-tab`;
  const panelId = `${instanceId}-account-panel`;
  const interactionLocked = isSubmitting || writePending;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const focusTab = (tab: AccountTab) => {
    (tab === "login" ? loginTabRef : signupTabRef).current?.focus();
  };

  const focusNameInputAfterRender = () => {
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const selectTab = (tab: AccountTab, moveFocus = false) => {
    setActiveTab(tab);
    setNameError(undefined);
    if (moveFocus) {
      window.requestAnimationFrame(() => focusTab(tab));
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: AccountTab,
  ) => {
    const currentIndex = accountTabs.indexOf(currentTab);
    let nextTab: AccountTab | undefined;

    if (event.key === "ArrowRight") {
      nextTab = accountTabs[(currentIndex + 1) % accountTabs.length];
    } else if (event.key === "ArrowLeft") {
      nextTab =
        accountTabs[
          (currentIndex - 1 + accountTabs.length) % accountTabs.length
        ];
    } else if (event.key === "Home") {
      nextTab = accountTabs[0];
    } else if (event.key === "End") {
      nextTab = accountTabs.at(-1);
    }

    if (!nextTab) return;
    event.preventDefault();
    setActiveTab(nextTab);
    setNameError(undefined);
    focusTab(nextTab);
  };

  const handleCreateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateProfileName(draftName);
    if (!validation.valid) {
      setNameError(validation.error);
      nameInputRef.current?.focus();
      return;
    }

    setNameError(undefined);
    setIsSubmitting(true);
    try {
      const created = await onCreateProfile(validation.normalizedName);
      if (!isMountedRef.current) return;
      setIsSubmitting(false);
      if (created) {
        onContinue();
      } else {
        focusNameInputAfterRender();
      }
    } catch {
      if (!isMountedRef.current) return;
      setIsSubmitting(false);
      setNameError("Yerel profil şu anda kaydedilemedi. Lütfen tekrar dene.");
      focusNameInputAfterRender();
    }
  };

  const heading =
    activeTab === "login"
      ? hasLocalAccount
        ? profileActive
          ? "Rotan bu cihazda açık."
          : "Kaldığın yer seni bekliyor."
        : "Önce yerel profilini oluşturalım."
      : hasLocalAccount
        ? "Rotan zaten bu cihazda."
        : hasLearningProgress
          ? "İlerlemeni yerel profile bağla."
          : "Analiz rotanı kaydet.";

  return (
    <main id="main-content" className="page account-page" tabIndex={-1}>
      <div className="account-shell">
        <section className="account-intro" aria-labelledby="account-title">
          <div className="account-eyebrow">
            <span className="account-status-dot" aria-hidden="true" />
            Queryvale / Yerel profil
          </div>
          <h1 id="account-title">{heading}</h1>
          <p>
            E-posta, parola veya sunucu hesabı yok. Profilin ve ilerlemen bu
            tarayıcıda kalır; hiçbir hesap bilgisi cihazından çıkmaz.
          </p>

          <ul
            className="account-benefits"
            aria-label="Yerel profil özellikleri"
          >
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              {persistenceAvailable
                ? "Kaldığın vakayı ve sorgularını hatırlar"
                : "Hesapsız oturumda SQL pratiğine devam edebilirsin"}
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              Profil adını daha sonra değiştirebilirsin
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              Verilerini Ayarlar’dan dışa aktarabilirsin
            </li>
          </ul>
        </section>

        <section className="account-panel" aria-label="Yerel hesap işlemleri">
          <div
            className="account-tabs"
            role="tablist"
            aria-label="Hesap işlemleri"
          >
            <button
              ref={loginTabRef}
              id={tabId("login")}
              className={`account-tab ${activeTab === "login" ? "active" : ""}`}
              type="button"
              role="tab"
              disabled={interactionLocked}
              aria-selected={activeTab === "login"}
              aria-controls={panelId}
              tabIndex={activeTab === "login" ? 0 : -1}
              onClick={() => selectTab("login")}
              onKeyDown={(event) => handleTabKeyDown(event, "login")}
            >
              Giriş yap
            </button>
            <button
              ref={signupTabRef}
              id={tabId("signup")}
              className={`account-tab ${activeTab === "signup" ? "active" : ""}`}
              type="button"
              role="tab"
              disabled={interactionLocked}
              aria-selected={activeTab === "signup"}
              aria-controls={panelId}
              tabIndex={activeTab === "signup" ? 0 : -1}
              onClick={() => selectTab("signup")}
              onKeyDown={(event) => handleTabKeyDown(event, "signup")}
            >
              Hesap oluştur
            </button>
          </div>

          <div
            id={panelId}
            className="account-tab-panel"
            role="tabpanel"
            aria-labelledby={tabId(activeTab)}
            tabIndex={0}
          >
            {activeTab === "login" ? (
              hasLocalAccount ? (
                <div className="account-returning">
                  <div className="account-profile-summary">
                    <div className="account-avatar" aria-hidden="true">
                      {profileInitials(profileName)}
                    </div>
                    <div>
                      <span>Bu cihazdaki profil</span>
                      <strong>{profileName}</strong>
                    </div>
                  </div>

                  <dl className="account-progress-summary">
                    <div>
                      <dt>Tamamlanan</dt>
                      <dd>
                        {completedCount} / {totalCount} vaka
                      </dd>
                    </div>
                    {resumeTaskTitle ? (
                      <div>
                        <dt>Sıradaki vaka</dt>
                        <dd>{resumeTaskTitle}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="account-local-note">
                    <HardDrive size={18} aria-hidden="true" />
                    <p>
                      Bu profil parola ile korunmaz. Giriş yap düğmesi yalnız bu
                      cihazdaki mevcut profili görünür hâle getirir; veriler
                      internete gönderilmez.
                    </p>
                  </div>

                  {!persistenceAvailable ? (
                    <p className="account-warning" role="alert">
                      Kalıcı depolama kullanılamıyor. Bu oturumdaki
                      değişiklikler tarayıcı kapanınca kaybolabilir.
                    </p>
                  ) : null}

                  <button
                    className="account-primary-action"
                    type="button"
                    disabled={interactionLocked}
                    onClick={() => {
                      if (profileActive) {
                        onContinue();
                        return;
                      }
                      void onSignIn();
                    }}
                  >
                    {profileActive
                      ? "Rotama dön"
                      : `${profileName} profiline gir`}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="account-empty-state">
                  <UserRound size={26} aria-hidden="true" />
                  <h2>Bu cihazda kayıtlı bir profil yok.</h2>
                  <p>
                    Giriş yapabilmek için önce adınla yerel bir çalışma profili
                    oluştur.
                  </p>
                  <button
                    className="account-secondary-action"
                    type="button"
                    onClick={() => selectTab("signup", true)}
                  >
                    Hesap oluştur ekranına geç
                  </button>
                </div>
              )
            ) : hasLocalAccount ? (
              <div className="account-preserved-state">
                <CheckCircle2 size={28} aria-hidden="true" />
                <h2>Mevcut ilerlemen korunuyor.</h2>
                <p>
                  {profileName} profili bu cihazda zaten hazır. Yeni profil
                  oluşturmak yerine kaldığın rotaya güvenle dönebilirsin.
                </p>
                <p className="account-progress-line">
                  {completedCount} / {totalCount} vaka tamamlandı
                </p>
                <button
                  className="account-secondary-action"
                  type="button"
                  onClick={() => selectTab("login", true)}
                >
                  Giriş yap ekranına dön
                </button>
              </div>
            ) : (
              <form
                className="account-form"
                aria-busy={interactionLocked}
                onSubmit={handleCreateProfile}
              >
                <div className="account-form-heading">
                  <h2>Bu cihaz için profil oluştur</h2>
                  <p>
                    Adın yalnızca kişisel rota ve ilerleme ekranında görünür.
                  </p>
                </div>

                {hasLearningProgress ? (
                  <div className="account-progress-preserved">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <div>
                      <strong>Mevcut çalışmaların korunacak</strong>
                      <p>
                        {completedCount > 0
                          ? `${completedCount} tamamlanmış vakan ve sorguların`
                          : "Kaydedilmiş sorguların ve ilerlemen"}
                        {resumeTaskTitle
                          ? ` “${resumeTaskTitle}” konumuyla birlikte bu profile bağlanacak.`
                          : " bu profile bağlanacak."}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="account-field">
                  <label htmlFor={`${instanceId}-name`}>Adın</label>
                  <input
                    ref={nameInputRef}
                    id={`${instanceId}-name`}
                    name="profileName"
                    type="text"
                    autoComplete="name"
                    disabled={interactionLocked}
                    value={draftName}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={
                      nameError
                        ? `${instanceId}-name-help ${instanceId}-name-error`
                        : `${instanceId}-name-help`
                    }
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setDraftName(nextName);
                      if (nameError) {
                        const nextValidation = validateProfileName(nextName);
                        setNameError(
                          nextValidation.valid
                            ? undefined
                            : nextValidation.error,
                        );
                      }
                    }}
                  />
                  <small id={`${instanceId}-name-help`}>
                    2–32 karakter; daha sonra değiştirebilirsin.
                  </small>
                </div>

                {nameError ? (
                  <p
                    id={`${instanceId}-name-error`}
                    className="account-field-error"
                    role="alert"
                  >
                    {nameError}
                  </p>
                ) : null}

                {!persistenceAvailable ? (
                  <p className="account-warning" role="alert">
                    Bu tarayıcı kalıcı depolamaya izin vermiyor. Yerel profil
                    oluşturmak için depolama iznini etkinleştir veya hesapsız
                    devam et.
                  </p>
                ) : (
                  <div className="account-local-note">
                    <HardDrive size={18} aria-hidden="true" />
                    <p>
                      Profilin bu tarayıcıya kaydedilir. Başka cihaza geçerken
                      Ayarlar’daki JSON yedeğini kullanabilirsin.
                    </p>
                  </div>
                )}

                <button
                  className="account-primary-action"
                  type="submit"
                  disabled={!persistenceAvailable || interactionLocked}
                >
                  {interactionLocked
                    ? "Yerel profil hazırlanıyor…"
                    : "Yerel hesabımı oluştur ve başla"}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </form>
            )}
          </div>

          <div className="account-guest-divider" aria-hidden="true">
            <span>veya</span>
          </div>
          <button
            className="account-guest-action"
            type="button"
            disabled={interactionLocked}
            onClick={onGuestContinue}
          >
            {hasLocalAccount && !profileActive
              ? "Profili açmadan Studio’ya geç"
              : "Bu cihazda hesapsız devam et"}
          </button>
          <p className="account-guest-note">
            {hasLocalAccount && !profileActive
              ? "Yeni çalışmalar aynı cihazdaki çalışma alanına kaydedilir. Profilden çıkış bir güvenlik kilidi değildir."
              : persistenceAvailable
                ? "İlerlemen yine bu tarayıcıda tutulur; profil adı daha sonra eklenebilir."
                : "Bu oturumda çalışabilirsin; tarayıcı kapanınca değişiklikler kaybolabilir."}
          </p>
        </section>
      </div>
    </main>
  );
}
