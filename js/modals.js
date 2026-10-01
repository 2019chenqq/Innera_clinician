

let activeInvitePatientId = null;
let activeAppointmentPatientId = null;
let activeRemoveAppointmentPatientId = null;
function isDemoClinic() {
  const staff = window.INNERA_CURRENT_STAFF;

  if (!staff) return false;

  return (
    staff.email === "demo@innera.tw" ||
    staff.clinicName === "心域 Demo 診所"
  );
}

function openAddPatientModal() {
  document.getElementById("addPatientModal")?.classList.add("show");
}

function closeAddModal() {
  document.getElementById("addPatientModal")?.classList.remove("show");
}

function closeInviteModal() {
  document.getElementById("inviteModal")?.classList.remove("show");
}

function closeTodayAppointmentModal() {
  document
    .getElementById("addTodayAppointmentModal")
    ?.classList.remove("show");

  activeAppointmentPatientId = null;
}

function closeRemoveTodayAppointmentModal() {
  document
    .getElementById("removeTodayAppointmentModal")
    ?.classList.remove("show");

  activeRemoveAppointmentPatientId = null;
}

function getCurrentTaipeiTime() {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Taipei",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts.map(({ type, value }) => [type, value])
    );

  return `${values.hour}:${values.minute}`;
}

function getCurrentTaipeiDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts.map(({ type, value }) => [type, value])
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function initModals() {
  const addPatientModal = document.getElementById("addPatientModal");
  const addPatientForm = document.getElementById("addPatientForm");
  const inviteModal = document.getElementById("inviteModal");
  const todayAppointmentCheckbox =
    document.getElementById("newPatientTodayAppointment");

  const appointmentFields =
    document.getElementById("newPatientAppointmentFields");

  const addTodayAppointmentModal =
    document.getElementById("addTodayAppointmentModal");

  const removeTodayAppointmentModal =
    document.getElementById(
      "removeTodayAppointmentModal"
    );

  const confirmRemoveTodayAppointmentButton =
    document.getElementById(
      "confirmRemoveTodayAppointment"
    );

  const addTodayAppointmentForm =
    document.getElementById("addTodayAppointmentForm");

  const appointmentSessionDropdown =
    document.getElementById(
      "todayAppointmentSessionDropdown"
    );

  const appointmentSessionTrigger =
    appointmentSessionDropdown?.querySelector(
      ".appointment-session-trigger"
    );

  const appointmentSessionLabel =
    appointmentSessionDropdown?.querySelector(
      ".appointment-session-trigger-label"
    );

  const appointmentSessionInput =
    document.getElementById(
      "todayAppointmentSession"
    );

  const newPatientSessionDropdown =
    document.getElementById(
      "newPatientAppointmentSessionDropdown"
    );

  const newPatientSessionTrigger =
    newPatientSessionDropdown?.querySelector(
      ".appointment-session-trigger"
    );

  const newPatientSessionLabel =
    newPatientSessionDropdown?.querySelector(
      ".appointment-session-trigger-label"
    );

  const newPatientSessionInput =
    document.getElementById(
      "newPatientAppointmentSession"
    );

  function resetNewPatientSessionDropdown() {
    if (newPatientSessionInput) {
      newPatientSessionInput.value = "morning";
    }

    if (newPatientSessionLabel) {
      newPatientSessionLabel.textContent = "早診";
    }

    newPatientSessionDropdown
      ?.querySelectorAll(
        ".appointment-session-option"
      )
      .forEach((option) => {
        const isMorning =
          option.dataset.session === "morning";

        option.classList.toggle(
          "selected",
          isMorning
        );

        option
          .querySelector(".bi-check2")
          ?.remove();

        if (isMorning) {
          option.insertAdjacentHTML(
            "beforeend",
            '<i class="bi bi-check2"></i>'
          );
        }
      });

    newPatientSessionDropdown
      ?.classList.remove("open");

    newPatientSessionTrigger
      ?.setAttribute(
        "aria-expanded",
        "false"
      );
  }

  appointmentSessionTrigger?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      const isOpen =
        appointmentSessionDropdown
          ?.classList.toggle("open");

      appointmentSessionTrigger.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }
  );

  appointmentSessionDropdown
    ?.querySelectorAll(
      ".appointment-session-option"
    )
    .forEach((option) => {

      option.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();

          const value =
            option.dataset.session || "";

          const label =
            option.querySelector("span")
              ?.textContent || "";

          if (!value) return;

          if (appointmentSessionInput) {
            appointmentSessionInput.value =
              value;
          }

          if (appointmentSessionLabel) {
            appointmentSessionLabel.textContent =
              label;
          }

          appointmentSessionDropdown
            .querySelectorAll(
              ".appointment-session-option"
            )
            .forEach((item) => {
              item.classList.remove("selected");

              item
                .querySelector(".bi-check2")
                ?.remove();
            });

          option.classList.add("selected");

          if (
            !option.querySelector(".bi-check2")
          ) {
            option.insertAdjacentHTML(
              "beforeend",
              '<i class="bi bi-check2"></i>'
            );
          }

          appointmentSessionDropdown
            .classList.remove("open");

          appointmentSessionTrigger
            ?.setAttribute(
              "aria-expanded",
              "false"
            );
        }
      );
    });

    document.addEventListener(
      "click",
      () => {
        appointmentSessionDropdown
          ?.classList.remove("open");

        appointmentSessionTrigger
          ?.setAttribute(
            "aria-expanded",
            "false"
          );
      }
    );

    newPatientSessionTrigger?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        const isOpen =
          newPatientSessionDropdown
            ?.classList.toggle("open");

        newPatientSessionTrigger.setAttribute(
          "aria-expanded",
          String(isOpen)
        );
      }
    );

    newPatientSessionDropdown
      ?.querySelectorAll(
        ".appointment-session-option"
      )
      .forEach((option) => {
        option.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            const value =
              option.dataset.session || "";

            const label =
              option.querySelector("span")
                ?.textContent || "";

            if (!value) return;

            if (newPatientSessionInput) {
              newPatientSessionInput.value =
                value;
            }

            if (newPatientSessionLabel) {
              newPatientSessionLabel.textContent =
                label;
            }

            newPatientSessionDropdown
              .querySelectorAll(
                ".appointment-session-option"
              )
              .forEach((item) => {
                item.classList.remove("selected");

                item
                  .querySelector(".bi-check2")
                  ?.remove();
              });

            option.classList.add("selected");

            if (
              !option.querySelector(".bi-check2")
            ) {
              option.insertAdjacentHTML(
                "beforeend",
                '<i class="bi bi-check2"></i>'
              );
            }

            newPatientSessionDropdown
              .classList.remove("open");

            newPatientSessionTrigger
              ?.setAttribute(
                "aria-expanded",
                "false"
              );
          }
        );
      });

    document.addEventListener(
      "click",
      () => {
        newPatientSessionDropdown
          ?.classList.remove("open");

        newPatientSessionTrigger
          ?.setAttribute(
            "aria-expanded",
            "false"
          );
      }
    );

  todayAppointmentCheckbox?.addEventListener(
    "change",
    () => {
      if (appointmentFields) {
        appointmentFields.hidden =
          !todayAppointmentCheckbox.checked;
      }

      if (todayAppointmentCheckbox.checked) {
        const timeInput =
          document.getElementById(
            "newPatientAppointmentTime"
          );

        if (timeInput && !timeInput.value) {
          timeInput.value =
            getCurrentTaipeiTime();
        }
      }
    }
  );

  document.getElementById("addPatientButton")
    ?.addEventListener("click", () => {
      if (isDemoClinic()) {
        showToast(
          "展示環境不開放建立與連結真實個案；正式院所版本可新增個案並由患者透過心域 App 授權連結。"
        );
        return;
      }

      addPatientForm?.reset();

      resetNewPatientSessionDropdown();

      if (appointmentFields) {
        appointmentFields.hidden = true;
      }

      openAddPatientModal();
    });

  document.getElementById("closeAddPatientModal")
    ?.addEventListener("click", closeAddModal);

  document.getElementById("cancelAddPatient")
    ?.addEventListener("click", closeAddModal);

  addPatientModal?.addEventListener("click", (event) => {
    if (event.target === addPatientModal) {
      closeAddModal();
    }
  });

  addPatientForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName =
    document.getElementById("newPatientName").value.trim();

  const todayAppointment =
    document.getElementById("newPatientTodayAppointment")
      ?.checked === true;

  const appointmentSession =
    document.getElementById("newPatientAppointmentSession")
      ?.value || "";

  const appointmentTime =
    document.getElementById("newPatientAppointmentTime")
      ?.value || "";

  const rawQueueNumber =
    document.getElementById("newPatientQueueNumber")
      ?.value || "";

  const queueNumber =
    rawQueueNumber.trim() === ""
      ? null
      : Number(rawQueueNumber);

  if (!fullName) {
    showToast("請輸入個案姓名");
    return;
  }
  if (
    todayAppointment &&
    !appointmentSession
  ) {
    showToast("請選擇診別");
    return;
  }

  if (
    todayAppointment &&
    queueNumber !== null &&
    (!Number.isInteger(queueNumber) || queueNumber <= 0)
  ) {
    showToast("叫號請輸入正整數");
    return;
  }
  if (
    !window.InneraPatientLinkMVP ||
    typeof window.InneraPatientLinkMVP.createPatient !== "function"
  ) {
    console.error(
      "[Innera] 找不到 InneraPatientLinkMVP.createPatient"
    );
    showToast("新增個案功能尚未載入");
    return;
  }

  const submitButton =
    addPatientForm.querySelector('button[type="submit"]');

  const originalText =
    submitButton?.textContent || "新增個案";

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "新增中...";
    }

  const created =
  await window.InneraPatientLinkMVP.createPatient({
    legalName: fullName,

    todayAppointment,

    appointmentDate:
      todayAppointment
        ? getCurrentTaipeiDate()
        : "",

    appointmentSession:
      todayAppointment
        ? appointmentSession
        : "",

    appointmentTime:
      todayAppointment
        ? appointmentTime
        : "",

    queueNumber:
      todayAppointment
        ? queueNumber
        : null
  });

    console.info(
      "[Innera] 新增患者成功：",
      created
    );

    if (
      window.InneraPatientSync &&
      typeof window.InneraPatientSync.refresh === "function"
    ) {
      await window.InneraPatientSync.refresh();
    }

    closeAddModal();

      addPatientForm.reset();

      resetNewPatientSessionDropdown();

      if (appointmentFields) {
        appointmentFields.hidden = true;
      }

    const patientId =
      created?.patientId ||
      created?.id ||
      "";

    showToast(
      patientId
        ? `${maskPatientName(fullName)} 已新增（${patientId}）`
        : `${maskPatientName(fullName)} 已新增`
    );
  } catch (error) {
    console.error(
      "[Innera] 新增個案失敗：",
      error
    );

    showToast(
      `新增失敗：${error.message}`
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});
  document.addEventListener("click", (event) => {
    const button =
      event.target.closest(".add-to-today-button");

    if (!button) return;

    event.preventDefault();

    const row =
      button.closest(".patient-row");

    activeAppointmentPatientId =
      row?.dataset.code || null;

    if (!activeAppointmentPatientId) {
      showToast("找不到個案編號");
      return;
    }

    document.getElementById(
      "addTodayAppointmentPatientName"
    ).textContent =
      maskPatientName(
        row?.dataset.name || "個案"
      );

    addTodayAppointmentForm?.reset();

      if (appointmentSessionInput) {
        appointmentSessionInput.value = "morning";
      }

      if (appointmentSessionLabel) {
        appointmentSessionLabel.textContent = "早診";
      }

      appointmentSessionDropdown
        ?.querySelectorAll(
          ".appointment-session-option"
        )
        .forEach((option) => {
          const isMorning =
            option.dataset.session === "morning";

          option.classList.toggle(
            "selected",
            isMorning
          );

          option
            .querySelector(".bi-check2")
            ?.remove();

          if (isMorning) {
            option.insertAdjacentHTML(
              "beforeend",
              '<i class="bi bi-check2"></i>'
            );
          }
        });

      appointmentSessionDropdown
        ?.classList.remove("open");

      appointmentSessionTrigger
        ?.setAttribute(
          "aria-expanded",
          "false"
        );

      const appointmentTimeInput =
        document.getElementById(
          "todayAppointmentTime"
        );

    if (appointmentTimeInput) {
      appointmentTimeInput.value =
        getCurrentTaipeiTime();
    }

    addTodayAppointmentModal
      ?.classList.add("show");
    });
      document.addEventListener(
        "click",
        (event) => {
          const button =
            event.target.closest(
              ".remove-from-today-button"
            );

          if (!button) return;

          event.preventDefault();

          const row =
            button.closest(".patient-row");

          activeRemoveAppointmentPatientId =
            row?.dataset.code || null;

          if (!activeRemoveAppointmentPatientId) {
            showToast("找不到個案編號");
            return;
          }

          const patientName =
            row?.dataset.name || "個案";

          const patientNameElement =
            document.getElementById(
              "removeTodayAppointmentPatientName"
            );

          if (patientNameElement) {
            patientNameElement.textContent =
              maskPatientName(patientName);
          }

          removeTodayAppointmentModal
            ?.classList.add("show");
        }
      );

      document
        .getElementById(
          "closeRemoveTodayAppointmentModal"
        )
        ?.addEventListener(
          "click",
          closeRemoveTodayAppointmentModal
        );

      document
        .getElementById(
          "cancelRemoveTodayAppointment"
        )
        ?.addEventListener(
          "click",
          closeRemoveTodayAppointmentModal
        );

      removeTodayAppointmentModal
        ?.addEventListener(
          "click",
          (event) => {
            if (
              event.target ===
              removeTodayAppointmentModal
            ) {
              closeRemoveTodayAppointmentModal();
            }
          }
        );

        confirmRemoveTodayAppointmentButton
          ?.addEventListener(
            "click",
            async () => {
              if (!activeRemoveAppointmentPatientId) {
                showToast("找不到個案編號");
                return;
              }

              if (
                !window.InneraPatientLinkMVP ||
                typeof window.InneraPatientLinkMVP
                  .updatePatientAppointment !== "function"
              ) {
                showToast("掛號功能尚未載入");
                return;
              }

              const originalText =
                confirmRemoveTodayAppointmentButton
                  .textContent;

              try {
                confirmRemoveTodayAppointmentButton
                  .disabled = true;

                confirmRemoveTodayAppointmentButton
                  .textContent = "移出中...";

                await window.InneraPatientLinkMVP
                  .updatePatientAppointment({
                    patientId:
                      activeRemoveAppointmentPatientId,

                    todayAppointment: false
                  });

                if (
                  window.InneraPatientSync &&
                  typeof window.InneraPatientSync
                    .refresh === "function"
                ) {
                  await window.InneraPatientSync.refresh();
                }

                closeRemoveTodayAppointmentModal();

                showToast("已移出今日門診");

              } catch (error) {
                console.error(
                  "[Innera] 移出今日門診失敗：",
                  error
                );

                showToast(
                  `移出失敗：${error.message}`
                );

              } finally {
                confirmRemoveTodayAppointmentButton
                  .disabled = false;

                confirmRemoveTodayAppointmentButton
                  .textContent = originalText;
              }
            }
          );

      document
        .getElementById("closeAddTodayAppointmentModal")
        ?.addEventListener(
          "click",
          closeTodayAppointmentModal
        );

      document
        .getElementById("cancelAddTodayAppointment")
        ?.addEventListener(
          "click",
          closeTodayAppointmentModal
        );

      addTodayAppointmentModal?.addEventListener(
        "click",
        (event) => {
          if (event.target === addTodayAppointmentModal) {
            closeTodayAppointmentModal();
          }
        }
      );

    addTodayAppointmentForm?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        if (!activeAppointmentPatientId) {
          showToast("找不到個案編號");
          return;
        }

        const appointmentSession =
          document.getElementById(
            "todayAppointmentSession"
          )?.value || "";

        const appointmentTime =
          document.getElementById(
            "todayAppointmentTime"
          )?.value || "";

        const rawQueueNumber =
          document.getElementById(
            "todayAppointmentQueueNumber"
          )?.value || "";

        const queueNumber =
          rawQueueNumber.trim() === ""
            ? null
            : Number(rawQueueNumber);

        if (!appointmentSession) {
          showToast("請選擇診別");
          return;
        }

        if (
          queueNumber !== null &&
          (!Number.isInteger(queueNumber) ||
            queueNumber <= 0)
        ) {
          showToast("叫號請輸入正整數");
          return;
        }

        if (
          !window.InneraPatientLinkMVP ||
          typeof window.InneraPatientLinkMVP
            .updatePatientAppointment !== "function"
        ) {
          showToast("掛號功能尚未載入");
          return;
        }

        const submitButton =
          addTodayAppointmentForm.querySelector(
            'button[type="submit"]'
          );

        const originalText =
          submitButton?.textContent ||
          "加入今日門診";

        try {
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "加入中...";
          }

          await window.InneraPatientLinkMVP
            .updatePatientAppointment({
              patientId:
                activeAppointmentPatientId,

              todayAppointment: true,

              appointmentDate:
                getCurrentTaipeiDate(),

              appointmentSession,

              appointmentTime,

              queueNumber
            });

          if (
            window.InneraPatientSync &&
            typeof window.InneraPatientSync
              .refresh === "function"
          ) {
            await window.InneraPatientSync.refresh();
          }

          closeTodayAppointmentModal();

          showToast("已加入今日門診");
        } catch (error) {
          console.error(
            "[Innera] 加入今日門診失敗：",
            error
          );

          showToast(
            `加入失敗：${error.message}`
          );
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
              originalText;
          }
        }
      }
    );

    document.addEventListener("click", (event) => {
      const button = event.target.closest(".connect-button");
      if (!button) return;
      if (isDemoClinic()) {
        event.preventDefault();

        showToast(
          "展示環境不開放患者連結；正式院所版本可產生邀請碼，由患者於心域 App 完成授權。"
        );

        return;
      }
      event.preventDefault();

      const row = button.closest(".patient-row");

      activeInvitePatientId =
        row?.dataset.code || null;

      document.getElementById("invitePatientName").textContent =
        maskPatientName(row?.dataset.name || "個案");

      document.getElementById("inviteCode").textContent = "--";

      inviteModal?.classList.add("show");
    });

      document.getElementById("closeInviteModal")
        ?.addEventListener("click", closeInviteModal);

      document.getElementById("cancelInvite")
        ?.addEventListener("click", closeInviteModal);

      document.getElementById("generateInviteCode")
      ?.addEventListener("click", async () => {
        if (!activeInvitePatientId) {
          showToast("找不到個案編號");
          return;
        }

      if (
        !window.InneraPatientLinkMVP ||
        typeof window.InneraPatientLinkMVP.createInvite !== "function"
      ) {
        console.error(
          "[Innera] 找不到 InneraPatientLinkMVP.createInvite"
        );
        showToast("邀請功能尚未載入");
        return;
      }

    const button =
      document.getElementById("generateInviteCode");

    const originalText =
      button?.textContent || "產生代碼";

    try {
      if (button) {
        button.disabled = true;
        button.textContent = "產生中...";
      }

      const invite =
        await window.InneraPatientLinkMVP.createInvite({
          patientId: activeInvitePatientId
        });

      const code =
        invite?.code || "";

      if (!code) {
        throw new Error("未取得邀請碼");
      }

      document.getElementById(
        "inviteCode"
      ).textContent = code;

      console.info(
        "[Innera] 邀請碼建立成功：",
        invite
      );

      showToast("連結代碼已產生");
    } catch (error) {
      console.error(
        "[Innera] 建立邀請碼失敗：",
        error
      );

      showToast(
        `產生失敗：${error.message}`
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
}
