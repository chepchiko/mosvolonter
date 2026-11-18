
import { supabase } from './supabase.js';

const $ = id => document.getElementById(id);

// Сообщения пользователю
function message(text) {
    alert(text);
}

// Преобразование даты ДД.ММ.ГГГГ в ГГГГ-ММ-ДД
function convertDate(value) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());

    if (!match) return null;

    const [, day, month, year] = match;

    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    if (
        date.getDate() !== Number(day) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getFullYear() !== Number(year)
    ) {
        return null;
    }

    return `${year}-${month}-${day}`;
}

// =====================================
// РЕГИСТРАЦИЯ
// =====================================

const registerForm = $('registerForm');

if (registerForm) {

    registerForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const password = $('password').value;
        const confirmPassword = $('confirmPassword').value;

        if (password.length < 8) {
            message('Пароль должен содержать минимум 8 символов.');
            return;
        }

        if (password !== confirmPassword) {
            message('Пароли не совпадают!');
            return;
        }

        const birthDate = convertDate($('birthDate').value);

        if (!birthDate) {
            message('Введите правильную дату рождения.');
            return;
        }

        const gender =
            document.querySelector(
                'input[name="gender"]:checked'
            )?.value || '';

        const metadata = {
            last_name: $('lastName').value.trim(),
            first_name: $('firstName').value.trim(),

            middle_name: $('noMiddleName')?.checked
                ? ''
                : $('middleName').value.trim(),

            birth_date: birthDate,
            gender: gender,
            phone: $('phone').value.trim()
        };

        const button = registerForm.querySelector(
            'button[type="submit"]'
        );

        button.disabled = true;

        const { data, error } = await supabase.auth.signUp({

            email: $('email').value.trim(),

            password: password,

            options: {
                data: metadata
            }

        });

        button.disabled = false;

        if (error) {
            message('Ошибка регистрации: ' + error.message);
            return;
        }

        if (!data.session) {

            message(
                'Регистрация выполнена! Проверьте электронную почту и подтвердите аккаунт.'
            );

            window.location.href = 'login.html';
            return;
        }

        message('Вы успешно зарегистрировались!');

        window.location.href = 'profile.html';

    });

}

// =====================================
// АВТОРИЗАЦИЯ
// =====================================

const loginForm = $('loginForm');

if (loginForm) {

    loginForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value;

        const { data, error } =
            await supabase.auth.signInWithPassword({

                email: email,
                password: password

            });

        if (error) {

            message('Неверная почта или пароль.');

            return;
        }

        message('Вход выполнен успешно!');

        window.location.href = 'profile.html';

    });

}

// =====================================
// ОБНОВЛЕНИЕ ШАПКИ
// =====================================

async function updateHeader() {

    const link = $('authLink');

    if (!link) return;

    const { data: { user } } =
        await supabase.auth.getUser();

    if (user) {

        link.textContent =
            user.user_metadata?.first_name || 'Личный кабинет';

        link.href = 'profile.html';

    } else {

        link.textContent = 'Войти';

        link.href = 'login.html';

    }

}

updateHeader();

// =====================================
// ЛИЧНЫЙ КАБИНЕТ
// =====================================

if ($('profileName')) {

    const { data: { user }, error: userError } =
        await supabase.auth.getUser();

    if (userError || !user) {

        window.location.href = 'login.html';

    } else {

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {

            message('Не удалось загрузить профиль: ' + error.message);

        } else if (profile) {

            const fullName = [
                profile.last_name,
                profile.first_name,
                profile.middle_name
            ].filter(Boolean).join(' ');

            $('profileName').textContent =
                fullName || 'Волонтёр';

            $('profileAvatar').textContent =
                (
                    (profile.first_name || '?')[0] +
                    (profile.last_name || '')[0]
                ).toUpperCase();

            $('pLastName').textContent =
                profile.last_name || '—';

            $('pFirstName').textContent =
                profile.first_name || '—';

            $('pMiddleName').textContent =
                profile.middle_name || '—';

            $('pBirthDate').textContent =
                profile.birth_date
                    ? new Date(
                        profile.birth_date + 'T00:00:00'
                      ).toLocaleDateString('ru-RU')
                    : '—';

            $('pEmail').textContent = user.email || '—';

            $('pPhone').textContent =
                profile.phone || '—';

        }

        // Загружаем мероприятия пользователя

        const list = $('profileEventsList');

        if (list) {

            const { data: registrations, error: regError } =
                await supabase
                    .from('event_registrations')
                    .select(`
                        id,
                        status,
                        events (
                            id,
                            title,
                            start_date,
                            end_date
                        )
                    `)
                    .eq('user_id', user.id)
                    .neq('status', 'cancelled')
                    .order('created_at', {
                        ascending: false
                    });

            if (regError) {

                list.textContent =
                    'Ошибка загрузки мероприятий: ' + regError.message;

            } else if (!registrations.length) {

                list.textContent =
                    'Вы пока не записаны на мероприятия.';

            } else {

                list.replaceChildren();

                registrations.forEach(registration => {

                    const event = registration.events;

                    if (!event) return;

                    const item = document.createElement('div');
                    item.className = 'profile-event';

                    const info = document.createElement('div');

                    const title = document.createElement('h3');
                    title.textContent = event.title;

                    const dates = document.createElement('small');

                    dates.textContent = [
                        event.start_date,
                        event.end_date
                    ].filter(Boolean).map(date =>
                        new Date(date + 'T00:00:00')
                            .toLocaleDateString('ru-RU')
                    ).join(' — ');

                    info.append(title, dates);

                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.textContent = 'Записан';

                    item.append(info, badge);

                    list.append(item);

                });

            }

            const statEvents = $('statEvents');

            if (statEvents) {
                statEvents.textContent =
                    registrations?.filter(
                        r => r.status === 'registered'
                    ).length ?? 0;
            }

        }

    }

    // Выход из аккаунта

    const logoutButton = $('logoutButton');

    if (logoutButton) {

        logoutButton.addEventListener('click', async () => {

            const { error } = await supabase.auth.signOut();

            if (error) {
                message('Ошибка выхода: ' + error.message);
            } else {
                window.location.href = 'index.html';
            }

        });

    }

}
