
import { supabase } from './supabase.js';

const container = document.getElementById('eventsList');

// Преобразование даты
function formatDate(date) {

    if (!date) return '';

    return new Date(date + 'T00:00:00')
        .toLocaleDateString('ru-RU');

}

// Получение мероприятий из базы
async function loadEvents() {

    if (!container) return;

    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', {
            ascending: true
        });

    if (error) {

        container.textContent =
            'Ошибка загрузки мероприятий: ' + error.message;

        return;
    }

    if (!events || events.length === 0) {

        container.textContent =
            'Пока нет доступных мероприятий.';

        return;
    }

    container.replaceChildren();

    events.forEach(event => {

        // Карточка мероприятия
        const card = document.createElement('div');

        card.className = 'event-item';

        // Информация
        const info = document.createElement('div');

        info.className = 'event-info';

        const dates = document.createElement('h4');

        dates.textContent =
            formatDate(event.start_date) +
            ' — ' +
            formatDate(event.end_date);

        const title = document.createElement('p');

        title.textContent = event.title;

        const description = document.createElement('p');

        description.textContent =
            event.description || '';

        info.append(dates, title, description);

        // Кнопка записи
        const button = document.createElement('button');

        button.className = 'btn btn-primary';

        button.textContent = 'Стать волонтером';

        button.type = 'button';

        button.addEventListener('click', async () => {

            // Проверяем авторизацию
            const { data: { user } } =
                await supabase.auth.getUser();

            if (!user) {

                window.location.href = 'login.html';

                return;
            }

            // Записываем пользователя
            const { error } = await supabase
                .from('event_registrations')
                .insert({

                    user_id: user.id,

                    event_id: event.id

                });

            if (error?.code === '23505') {

                alert('Вы уже записаны на это мероприятие!');

            } else if (error) {

                alert('Ошибка записи: ' + error.message);

            } else {

                alert('Вы успешно записались!');

            }

        });

        card.append(info, button);

        container.append(card);

    });

}

// Запускаем загрузку
loadEvents();
