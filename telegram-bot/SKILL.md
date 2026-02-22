---
name: telegram-bot
description: Build Telegram bots with the complete aiogram 3.x ecosystem - FSM for conversation flows, aiogram-dialog for GUI-like windows and widgets, Scenes for isolated multi-step workflows, aiogram-i18n for internationalization, routers for modular design, middleware, inline keyboards, and production-ready patterns. Master the full aiogram stack for professional Telegram bot development.
---

# Telegram Bot Development with aiogram 3.x Ecosystem

Build production-ready Telegram bots using the complete aiogram 3.x ecosystem with FSM, Dialog framework, Scenes, i18n, and modern async Python patterns.

## What This Skill Provides

### aiogram Ecosystem Coverage

This skill covers the **complete aiogram ecosystem**, not just the core framework:

1. **aiogram 3.x** (Core) - Async bot framework with FSM, routers, middleware
2. **aiogram-dialog** - GUI framework for window/widget-based interfaces ([GitHub: Tishka17/aiogram_dialog](https://github.com/Tishka17/aiogram_dialog), 874⭐)
3. **Scenes** (Built-in 3.x) - Isolated conversation contexts and wizards
4. **aiogram-i18n** - Internationalization and multilingual support ([GitHub: aiogram/i18n](https://github.com/aiogram/i18n))
5. **Magic Filter (F)** - Expressive filter syntax built into aiogram

### Core Capabilities

**Basic aiogram:**
- Async/await architecture (Python 3.7+)
- FSM (Finite State Machines) for conversation flows
- Routers for modular bot structure
- Middleware for request/response pipeline
- Inline keyboards and callbacks
- Error handling patterns

**aiogram-dialog Extensions:**
- Window-based GUI interfaces
- Reusable widgets (calendars, multiselect, counters)
- Declarative rendering (Jinja2 templates)
- Automatic message updates
- Offline HTML preview
- Transition diagrams

**Scenes Features:**
- Isolated conversation contexts
- SceneWizard for guided multi-step flows
- SceneRegistry for scene management
- Entry/exit lifecycle hooks

**i18n Capabilities:**
- Multi-language support
- Lazy translation proxies
- FluentRuntimeCore integration
- I18nMiddleware

### When to Use What

| Need | Use | Example |
|------|-----|---------|
| Simple command handlers | aiogram core | /start, /help commands |
| Multi-step forms | FSM States | Registration, surveys |
| GUI-like menus/dialogs | aiogram-dialog | Settings menu, product catalog |
| Isolated workflows | Scenes | Quiz flow, onboarding wizard |
| Multi-language bot | aiogram-i18n | International bots |
| Complex filters | Magic Filter (F) | Conditional routing |

---

## Part 1: Core aiogram Setup

### Installation

```bash
# Core aiogram
pip install aiogram

# With faster JSON parsing
pip install aiogram[fast]

# With Redis storage
pip install aiogram[redis]

# aiogram-dialog (GUI framework)
pip install aiogram-dialog

# aiogram-i18n (translations)
pip install aiogram-i18n

# Using uv
uv pip install aiogram aiogram-dialog aiogram-i18n
```

**Requirements:** Python 3.7+

### Minimal Bot Example

```python
import asyncio
from aiogram import Bot, Dispatcher
from aiogram.types import Message
from aiogram.filters import Command

BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(f"Hello, {message.from_user.full_name}!")

@dp.message()
async def echo_message(message: Message):
    await message.answer(message.text)

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

### Recommended Project Structure

```
telegram_bot/
├── bot.py                    # Main entry point
├── config.py                 # Configuration (tokens, settings)
├── handlers/                 # Handler modules
│   ├── __init__.py
│   ├── start.py              # Basic commands
│   ├── forms.py              # FSM-based forms
│   └── dialogs/              # aiogram-dialog windows
│       ├── __init__.py
│       ├── menu.py           # Main menu dialog
│       └── settings.py       # Settings dialog
├── scenes/                   # Scene definitions
│   ├── __init__.py
│   ├── quiz.py               # Quiz scene
│   └── onboarding.py         # Onboarding scene
├── middlewares/              # Custom middleware
│   ├── __init__.py
│   ├── auth.py               # Authentication
│   └── i18n.py               # Translation middleware
├── keyboards/                # Keyboard builders
│   ├── __init__.py
│   ├── inline.py             # Inline keyboards
│   └── reply.py              # Reply keyboards
├── states/                   # FSM state groups
│   ├── __init__.py
│   └── forms.py              # Form states
├── locales/                  # Translation files (i18n)
│   ├── en/
│   │   └── LC_MESSAGES/
│   │       └── messages.ftl  # English translations
│   └── ru/
│       └── LC_MESSAGES/
│           └── messages.ftl  # Russian translations
└── utils/                    # Utility functions
    ├── __init__.py
    └── db.py                 # Database helpers
```

---

## Part 2: FSM (Finite State Machines)

### What is FSM?

FSM manages conversation flows with multiple steps. Perfect for registration forms, surveys, order processes, multi-step wizards.

### Defining States

```python
# states/forms.py
from aiogram.fsm.state import State, StatesGroup

class RegistrationForm(StatesGroup):
    name = State()
    age = State()
    email = State()
    confirm = State()
```

### FSM Handler Example

```python
# handlers/forms.py
from aiogram import Router, F
from aiogram.types import Message
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from states.forms import RegistrationForm

router = Router()

@router.message(Command("register"))
async def cmd_register(message: Message, state: FSMContext):
    await state.set_state(RegistrationForm.name)
    await message.answer("Please enter your name:")

@router.message(RegistrationForm.name)
async def process_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await state.set_state(RegistrationForm.age)
    await message.answer("Thanks! Now enter your age:")

@router.message(RegistrationForm.age)
async def process_age(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("Please enter a valid number!")
        return

    await state.update_data(age=int(message.text))
    await state.set_state(RegistrationForm.email)
    await message.answer("Great! Now enter your email:")

@router.message(RegistrationForm.email)
async def process_email(message: Message, state: FSMContext):
    await state.update_data(email=message.text)
    data = await state.get_data()

    confirmation_text = f"""
Please confirm your registration:
Name: {data['name']}
Age: {data['age']}
Email: {data['email']}

Type 'yes' to confirm or 'no' to cancel.
    """
    await state.set_state(RegistrationForm.confirm)
    await message.answer(confirmation_text)

@router.message(RegistrationForm.confirm, F.text.lower() == "yes")
async def process_confirm(message: Message, state: FSMContext):
    data = await state.get_data()
    # Save to database here
    await message.answer("✅ Registration complete!")
    await state.clear()

@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("Cancelled.")
```

### FSM Storage Options

```python
from aiogram import Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.fsm.storage.redis import RedisStorage
from redis.asyncio import Redis

# In-memory (default, not persistent)
dp = Dispatcher(storage=MemoryStorage())

# Redis (persistent, production-ready)
redis = Redis(host='localhost', port=6379)
dp = Dispatcher(storage=RedisStorage(redis=redis))
```

---

## Part 3: aiogram-dialog (GUI Framework)

aiogram-dialog transforms Telegram bots into GUI-like applications with windows, widgets, and declarative rendering.

**Resources:**
- [Official Docs](https://aiogram-dialog.readthedocs.io/)
- [GitHub Repository](https://github.com/Tishka17/aiogram_dialog)
- [Quickstart Guide](https://aiogram-dialog.readthedocs.io/en/latest/quickstart/)

### Core Concepts

**Window:** UI component that displays content (text + keyboards)
**Dialog:** Container grouping one or more windows
**DialogManager:** Service for dialog navigation
**Widgets:** Reusable UI components (buttons, calendars, selects, etc.)

### Window Widget Types

**Text Widgets:**
- `Const` - Static text
- `Format` - Dynamic formatting with variables
- `Multi` - Multiple text widgets
- `Case` - Conditional text
- `Progress` - Progress bars
- `List` - Lists of items
- Jinja2 templates

**Keyboard Widgets:**
- `Button` - Click action
- `Url` - External link
- `Select` - List selection
- `Radio` - Single choice
- `Checkbox` - Multi-choice
- `Calendar` - Date picker
- `Counter` - Number increment/decrement
- Navigation controls (SwitchTo, Start, Cancel, Next, Back)

**Input Widgets:**
- `MessageInput` - Capture any message
- `TextInput` - Text input with validation

**Media Widgets:**
- `StaticMedia` - Fixed images/files
- `DynamicMedia` - Dynamic media loading

### Basic Dialog Example

```python
from aiogram import Router
from aiogram.filters import Command
from aiogram.fsm.state import State, StatesGroup
from aiogram_dialog import Dialog, DialogManager, Window, StartMode, setup_dialogs
from aiogram_dialog.widgets.text import Const, Format
from aiogram_dialog.widgets.kbd import Button, SwitchTo, Cancel

# Define states
class MenuStates(StatesGroup):
    main = State()
    settings = State()
    about = State()

# Create windows
main_window = Window(
    Const("🏠 Main Menu"),
    Format("Welcome, {user_name}!"),
    SwitchTo(
        text=Const("⚙️ Settings"),
        id="to_settings",
        state=MenuStates.settings
    ),
    SwitchTo(
        text=Const("ℹ️ About"),
        id="to_about",
        state=MenuStates.about
    ),
    Cancel(Const("❌ Close")),
    state=MenuStates.main,
    getter=lambda dialog_manager, **kwargs: {
        "user_name": dialog_manager.event.from_user.full_name
    }
)

settings_window = Window(
    Const("⚙️ Settings"),
    Button(
        text=Const("🔄 Reset"),
        id="reset",
        on_click=lambda c, b, m: m.event.answer("Settings reset!")
    ),
    SwitchTo(
        text=Const("🔙 Back"),
        id="back",
        state=MenuStates.main
    ),
    state=MenuStates.settings
)

about_window = Window(
    Const("ℹ️ About"),
    Const("This is a demo bot built with aiogram-dialog."),
    SwitchTo(
        text=Const("🔙 Back"),
        id="back",
        state=MenuStates.main
    ),
    state=MenuStates.about
)

# Create dialog
menu_dialog = Dialog(main_window, settings_window, about_window)

# Setup router
router = Router()
router.include_router(menu_dialog)

# Start dialog handler
@router.message(Command("menu"))
async def start_menu(message: Message, dialog_manager: DialogManager):
    await dialog_manager.start(MenuStates.main, mode=StartMode.RESET_STACK)

# Setup dialogs in main
# dp.include_router(router)
# setup_dialogs(dp)
```

### Advanced Dialog with Calendar

```python
from aiogram_dialog.widgets.kbd import Calendar
from datetime import date

async def on_date_selected(callback, widget, manager: DialogManager, selected_date: date):
    await callback.answer(f"Selected: {selected_date}")
    await manager.done()

date_window = Window(
    Const("📅 Select a date:"),
    Calendar(id="calendar", on_click=on_date_selected),
    Cancel(Const("❌ Cancel")),
    state=DateStates.select
)
```

### Dialog with Dynamic Select

```python
from aiogram_dialog.widgets.kbd import Select

# Getter function provides data
async def get_products(**kwargs):
    return {
        "products": [
            ("product_1", "Laptop - $999"),
            ("product_2", "Mouse - $29"),
            ("product_3", "Keyboard - $79"),
        ]
    }

async def on_product_selected(callback, widget, manager: DialogManager, item_id: str):
    await callback.answer(f"Selected: {item_id}")

product_window = Window(
    Const("🛒 Select a product:"),
    Select(
        Format("{item[1]}"),  # Display text
        id="product_select",
        item_id_getter=lambda x: x[0],  # ID
        items="products",  # From getter
        on_click=on_product_selected
    ),
    state=ShopStates.products,
    getter=get_products
)
```

### Dialog Setup in Main

```python
from aiogram import Bot, Dispatcher
from aiogram_dialog import setup_dialogs

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Include dialog routers
dp.include_router(menu_dialog)
dp.include_router(shop_dialog)

# CRITICAL: Call setup_dialogs BEFORE start_polling
setup_dialogs(dp)

async def main():
    await dp.start_polling(bot)
```

---

## Part 4: Scenes (Built-in aiogram 3.x)

Scenes create **isolated conversation contexts** where global handlers are bypassed. Perfect for quizzes, guided workflows, multi-step onboarding.

**Official Documentation:**
- [Scenes Wizard Docs](https://docs.aiogram.dev/en/latest/dispatcher/finite_state_machine/scene.html)

### Core Components

**Scene:** Isolated namespace/room for focused interactions
**SceneRegistry:** Container for all scenes
**ScenesManager:** Manages user transitions between scenes
**SceneWizard:** Enables scene navigation (enter, exit, goto, back, retake)
**SceneConfig:** Scene configuration (state, handlers, lifecycle)

### Creating a Scene

```python
from aiogram.fsm.scene import Scene, on, ScenesManager
from aiogram.types import Message
from aiogram.filters import Command

class QuizScene(Scene, state="quiz"):
    """Quiz scene with isolated context."""

    @on.message.enter()
    async def on_enter(self, message: Message):
        """Called when user enters scene."""
        await message.answer(
            "📝 Quiz Started!\n\n"
            "Question 1: What is 2+2?\n"
            "Reply with the answer."
        )

    @on.message()
    async def handle_answer(self, message: Message, wizard: SceneWizard):
        """Handle quiz answers."""
        if message.text == "4":
            await message.answer("✅ Correct!")
            await wizard.exit()  # Exit scene
        else:
            await message.answer("❌ Try again!")
            await wizard.retake()  # Re-enter scene

    @on.message.exit()
    async def on_exit(self, message: Message):
        """Called when user leaves scene."""
        await message.answer("Quiz completed!")

# Setup scene registry
from aiogram import Router

router = Router()
scene_registry = SceneRegistry(router)
scene_registry.add(QuizScene)

# Entry point handler
@router.message(Command("quiz"))
async def start_quiz(message: Message, scenes: ScenesManager):
    await scenes.enter(QuizScene)
```

### Scene Navigation Methods

```python
class MyScene(Scene, state="my_scene"):

    @on.message()
    async def handler(self, message: Message, wizard: SceneWizard):
        # Enter another scene
        await wizard.enter(OtherScene)

        # Exit current scene
        await wizard.exit()

        # Go to specific scene
        await wizard.goto(TargetScene)

        # Re-enter current scene (reset)
        await wizard.retake()

        # Go back to previous scene
        await wizard.back()
```

### Multi-Scene Wizard Example

```python
from aiogram.fsm.state import State

class OnboardingWizard:
    """Multi-scene onboarding flow."""

    class WelcomeScene(Scene, state="welcome"):
        @on.message.enter()
        async def on_enter(self, message: Message):
            await message.answer(
                "👋 Welcome to the bot!\n\n"
                "Let's get you set up. What's your name?"
            )

        @on.message()
        async def handle_name(self, message: Message, state: FSMContext, wizard: SceneWizard):
            await state.update_data(name=message.text)
            await wizard.goto(OnboardingWizard.AgeScene)

    class AgeScene(Scene, state="age"):
        @on.message.enter()
        async def on_enter(self, message: Message):
            await message.answer("How old are you?")

        @on.message()
        async def handle_age(self, message: Message, state: FSMContext, wizard: SceneWizard):
            if not message.text.isdigit():
                await message.answer("Please enter a number!")
                await wizard.retake()
                return

            await state.update_data(age=int(message.text))
            await wizard.goto(OnboardingWizard.ConfirmScene)

    class ConfirmScene(Scene, state="confirm"):
        @on.message.enter()
        async def on_enter(self, message: Message, state: FSMContext):
            data = await state.get_data()
            await message.answer(
                f"Confirm your details:\n"
                f"Name: {data['name']}\n"
                f"Age: {data['age']}\n\n"
                f"Type 'yes' to confirm."
            )

        @on.message()
        async def handle_confirm(self, message: Message, wizard: SceneWizard):
            if message.text.lower() == "yes":
                await message.answer("✅ Onboarding complete!")
                await wizard.exit()
            else:
                await wizard.back()  # Go back to previous scene

# Register all scenes
scene_registry.add(OnboardingWizard.WelcomeScene)
scene_registry.add(OnboardingWizard.AgeScene)
scene_registry.add(OnboardingWizard.ConfirmScene)
```

### Scene Lifecycle Hooks

```python
class MyScene(Scene, state="my_scene"):

    @on.message.enter()
    async def on_enter(self, message: Message):
        """Called when entering scene."""
        print("Entering scene")

    @on.message.exit()
    async def on_exit(self, message: Message):
        """Called when exiting scene."""
        print("Exiting scene")

    @on.message()
    async def handle_message(self, message: Message):
        """Regular message handler within scene."""
        await message.answer("Handling message in scene")
```

---

## Part 5: aiogram-i18n (Internationalization)

aiogram-i18n provides multi-language support with lazy translation, FluentRuntimeCore, and middleware integration.

**Resources:**
- [GitHub Repository](https://github.com/aiogram/i18n)
- [PyPI Package](https://pypi.org/project/aiogram-i18n/)
- [Official Docs](https://docs.aiogram.dev/en/latest/utils/i18n.html)

### Installation & Setup

```bash
pip install aiogram-i18n
```

### Translation File Structure

```
locales/
├── en/
│   └── LC_MESSAGES/
│       └── messages.ftl  # English translations
├── ru/
│   └── LC_MESSAGES/
│       └── messages.ftl  # Russian translations
└── es/
    └── LC_MESSAGES/
        └── messages.ftl  # Spanish translations
```

### Fluent Translation Files

```fluent
# locales/en/LC_MESSAGES/messages.ftl
welcome = Welcome, { $name }!
button-start = Start
button-settings = Settings
ask-name = What is your name?
registration-complete = Registration complete!

# locales/ru/LC_MESSAGES/messages.ftl
welcome = Добро пожаловать, { $name }!
button-start = Начать
button-settings = Настройки
ask-name = Как вас зовут?
registration-complete = Регистрация завершена!
```

### I18n Middleware Setup

```python
from aiogram import Bot, Dispatcher
from aiogram_i18n import I18nMiddleware
from aiogram_i18n.cores import FluentRuntimeCore

# Create i18n middleware
i18n_middleware = I18nMiddleware(
    core=FluentRuntimeCore(
        path="locales/{locale}/LC_MESSAGES"
    ),
    default_locale="en",
    allowed_locales=["en", "ru", "es"]
)

# Register middleware
dp = Dispatcher()
i18n_middleware.setup(dispatcher=dp)
```

### Using Translations in Handlers

```python
from aiogram_i18n import gettext as _
from aiogram_i18n import lazy_gettext as __

@router.message(Command("start"))
async def cmd_start(message: Message):
    # Translate at runtime
    await message.answer(
        _("welcome", name=message.from_user.full_name)
    )

@router.message(Command("register"))
async def cmd_register(message: Message):
    await message.answer(_("ask-name"))
```

### Lazy Translation for Keyboards

```python
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram_i18n import lazy_gettext as __

def get_menu_keyboard():
    """Keyboard with lazy translations."""
    buttons = [
        [InlineKeyboardButton(
            text=__("button-start"),
            callback_data="start"
        )],
        [InlineKeyboardButton(
            text=__("button-settings"),
            callback_data="settings"
        )],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
```

### Dynamic Locale Selection

```python
from aiogram_i18n import I18nContext

@router.message(Command("language"))
async def cmd_language(message: Message, i18n: I18nContext):
    # Get current locale
    current = i18n.locale

    # Set new locale
    i18n.locale = "ru"  # Switch to Russian

    await message.answer(f"Language changed from {current} to {i18n.locale}")
```

### Locale from User Data

```python
from aiogram_i18n.middleware import I18nMiddleware

async def get_user_locale(event):
    """Get user's preferred locale from database."""
    user_id = event.from_user.id
    # Fetch from database
    user_locale = await db.get_user_locale(user_id)
    return user_locale or "en"

i18n_middleware = I18nMiddleware(
    core=FluentRuntimeCore(path="locales/{locale}/LC_MESSAGES"),
    manager=get_user_locale  # Custom locale resolver
)
```

---

## Part 6: Magic Filter (F)

Magic Filter provides expressive syntax for filtering messages, callbacks, and events.

**Documentation:**
- [Magic Filters Docs](https://docs.aiogram.dev/en/latest/dispatcher/filters/magic_filters.html)

### Text Filters

```python
from aiogram import F

# Exact match
@router.message(F.text == "Hello")

# Contains
@router.message(F.text.contains("hello"))

# Starts with
@router.message(F.text.startswith("/"))

# Ends with
@router.message(F.text.endswith("!"))

# Case-insensitive
@router.message(F.text.lower() == "hello")

# Is digit
@router.message(F.text.isdigit())

# Regex match
@router.message(F.text.regexp(r"^\d{3}-\d{3}-\d{4}$"))  # Phone number
```

### Media Filters

```python
# Photo message
@router.message(F.photo)

# Document with specific extension
@router.message(F.document.file_name.endswith(".pdf"))

# Video message
@router.message(F.video)

# Audio message
@router.message(F.audio)

# Voice message
@router.message(F.voice)

# Sticker
@router.message(F.sticker)
```

### Callback Query Filters

```python
# Exact callback data
@router.callback_query(F.data == "button_click")

# Callback data starts with
@router.callback_query(F.data.startswith("page_"))

# Callback data contains
@router.callback_query(F.data.contains("product"))
```

### Combined Filters

```python
from aiogram.filters import Command

# Combine with AND
@router.message(Command("admin") & F.from_user.id.in_([123, 456]))

# Combine with OR
@router.message(F.text.contains("help") | F.text.contains("support"))

# Negate with NOT
@router.message(~F.photo)  # Messages without photos
```

### User Filters

```python
# User ID
@router.message(F.from_user.id == 123456789)

# User IDs in list
@router.message(F.from_user.id.in_([123, 456, 789]))

# Username
@router.message(F.from_user.username == "john_doe")

# Is bot
@router.message(F.from_user.is_bot == False)
```

---

## Part 7: Routers & Middleware

### Routers (Modular Design)

```python
# handlers/admin.py
from aiogram import Router

admin_router = Router()

@admin_router.message(Command("admin"))
async def admin_panel(message: Message):
    await message.answer("Admin panel")

# handlers/user.py
user_router = Router()

@user_router.message(Command("profile"))
async def user_profile(message: Message):
    await message.answer("User profile")

# bot.py
dp.include_router(admin_router)
dp.include_router(user_router)
```

### Middleware (Request Processing)

```python
from aiogram import BaseMiddleware
from typing import Callable, Dict, Any, Awaitable

class AuthMiddleware(BaseMiddleware):
    def __init__(self, admin_ids: list[int]):
        self.admin_ids = admin_ids
        super().__init__()

    async def __call__(
        self,
        handler: Callable[[Message, Dict[str, Any]], Awaitable[Any]],
        event: Message,
        data: Dict[str, Any]
    ) -> Any:
        if event.from_user.id not in self.admin_ids:
            await event.answer("⛔ Access denied!")
            return

        data["is_admin"] = True
        return await handler(event, data)

# Register middleware
admin_router.message.middleware(AuthMiddleware(admin_ids=[123456789]))
```

---

## Part 8: Complete Ecosystem Example

### Production Bot with Full Stack

```python
import asyncio
from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.fsm.scene import Scene, on, ScenesManager, SceneRegistry
from aiogram_dialog import Dialog, Window, DialogManager, setup_dialogs, StartMode
from aiogram_dialog.widgets.text import Const, Format
from aiogram_dialog.widgets.kbd import Button, Cancel, SwitchTo
from aiogram_i18n import I18nMiddleware
from aiogram_i18n.cores import FluentRuntimeCore
from redis.asyncio import Redis

# Configuration
BOT_TOKEN = "YOUR_TOKEN"

# Initialize bot with Redis storage
redis = Redis(host='localhost', port=6379)
storage = RedisStorage(redis=redis)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=storage)

# Setup i18n
i18n = I18nMiddleware(
    core=FluentRuntimeCore(path="locales/{locale}/LC_MESSAGES"),
    default_locale="en"
)
i18n.setup(dispatcher=dp)

# Scene example
class WelcomeScene(Scene, state="welcome"):
    @on.message.enter()
    async def on_enter(self, message: Message):
        await message.answer("Welcome to the bot! Type /menu for options.")

    @on.message()
    async def handle(self, message: Message, wizard: SceneWizard):
        await wizard.exit()

# Dialog example
class MenuStates(StatesGroup):
    main = State()

menu_window = Window(
    Const("🏠 Main Menu"),
    Button(Const("ℹ️ Info"), id="info", on_click=lambda c, b, m: c.answer("Bot info!")),
    Cancel(Const("❌ Close")),
    state=MenuStates.main
)

menu_dialog = Dialog(menu_window)

# Router setup
main_router = Router()
main_router.include_router(menu_dialog)

scene_registry = SceneRegistry(main_router)
scene_registry.add(WelcomeScene)

@main_router.message(Command("start"))
async def cmd_start(message: Message, scenes: ScenesManager):
    await scenes.enter(WelcomeScene)

@main_router.message(Command("menu"))
async def cmd_menu(message: Message, dialog_manager: DialogManager):
    await dialog_manager.start(MenuStates.main, mode=StartMode.RESET_STACK)

# Include router and setup
dp.include_router(main_router)
setup_dialogs(dp)

# Run bot
async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Best Practices

### ✅ DO

1. **Use aiogram-dialog for Complex UIs**
   - Menus, settings panels, product catalogs
   - Window-based navigation
   - Reusable widgets (calendars, selects)

2. **Use Scenes for Isolated Workflows**
   - Quizzes, onboarding, multi-step wizards
   - When you need context isolation
   - Entry/exit lifecycle hooks

3. **Use FSM for Simple Multi-Step Forms**
   - Registration, surveys, order forms
   - Linear state transitions
   - Data collection across steps

4. **Use i18n for Multi-Language Bots**
   - International audience
   - Fluent translation files
   - Lazy translation in keyboards

5. **Use Magic Filter (F) for Expressive Filtering**
   - Readable filter syntax
   - Combined conditions
   - Media type filtering

### ❌ DON'T

1. **Don't Mix Dialog and FSM for Same Feature**
   - Choose one approach per feature
   - Dialog for GUI-like, FSM for forms

2. **Don't Forget to Call `setup_dialogs(dp)`**
   - Required before `start_polling()`
   - Initializes dialog system

3. **Don't Ignore Scene Isolation**
   - Scenes bypass global handlers
   - Design scenes as independent units

---

## Ecosystem Comparison

| Feature | FSM | aiogram-dialog | Scenes |
|---------|-----|----------------|--------|
| **Best For** | Linear forms | GUI menus | Isolated flows |
| **Complexity** | Low | Medium | Medium |
| **UI Style** | Custom keyboards | Widget-based | Custom |
| **Navigation** | State transitions | Window switching | Scene jumps |
| **Data Storage** | FSMContext | DialogManager | FSMContext |
| **Isolation** | None | None | Full |
| **Reusability** | Low | High (widgets) | Medium |

---

## Part 9: Testing Telegram Bots

Testing is critical for production bots. There are two main approaches: **unit testing** with mocks and **integration testing** with real Telegram API.

**Testing Philosophy:**
- Unit tests → Fast, isolated handler testing
- Integration tests → Real-world behavior verification
- Both are necessary for production-ready bots

### Unit Testing with aiogram-tests

**aiogram-tests** ([GitHub](https://github.com/OCCASS/aiogram_tests)) provides MockedBot for testing handlers without real Telegram API calls.

**Installation:**

```bash
pip install aiogram-tests pytest pytest-asyncio

# Using uv
uv pip install aiogram-tests pytest pytest-asyncio
```

### Basic Unit Test Example

```python
# tests/test_handlers.py
import pytest
from aiogram_tests import MockedBot
from aiogram_tests.handler import MessageHandler
from aiogram_tests.types.dataset import MESSAGE
from handlers.start import cmd_start  # Your handler

@pytest.mark.asyncio
async def test_start_command():
    """Test /start command returns welcome message."""
    request = MockedBot(MessageHandler(cmd_start))
    calls = await request.query(message=MESSAGE.as_object(text="/start"))

    answer_message = calls.send_message.fetchone()
    assert "Welcome" in answer_message.text

@pytest.mark.asyncio
async def test_echo_handler():
    """Test echo handler repeats user message."""
    from handlers.echo import echo_handler

    request = MockedBot(MessageHandler(echo_handler))
    calls = await request.query(message=MESSAGE.as_object(text="Hello!"))

    answer = calls.send_message.fetchone()
    assert answer.text == "Hello!"
```

### Testing FSM Handlers

```python
import pytest
from aiogram_tests import MockedBot
from aiogram_tests.handler import MessageHandler
from aiogram_tests.types.dataset import MESSAGE
from aiogram.fsm.context import FSMContext
from handlers.forms import cmd_register, process_name
from states.forms import RegistrationForm

@pytest.mark.asyncio
async def test_registration_start():
    """Test /register command starts form."""
    request = MockedBot(MessageHandler(cmd_register))
    calls = await request.query(message=MESSAGE.as_object(text="/register"))

    answer = calls.send_message.fetchone()
    assert "enter your name" in answer.text.lower()

@pytest.mark.asyncio
async def test_registration_name_step():
    """Test name processing in registration form."""
    request = MockedBot(MessageHandler(process_name))

    # Simulate FSM state
    calls = await request.query(
        message=MESSAGE.as_object(text="John"),
        state=RegistrationForm.name
    )

    answer = calls.send_message.fetchone()
    assert "age" in answer.text.lower()
```

### Testing Callback Queries

```python
from aiogram_tests.types.dataset import CALLBACK_QUERY

@pytest.mark.asyncio
async def test_menu_callback():
    """Test menu button callback."""
    from handlers.menu import process_menu_settings

    request = MockedBot(CallbackQueryHandler(process_menu_settings))
    calls = await request.query(
        callback_query=CALLBACK_QUERY.as_object(data="menu_settings")
    )

    # Verify callback was answered
    assert calls.answer_callback_query.called

    # Verify message was edited
    edited = calls.edit_message_text.fetchone()
    assert "Settings" in edited.text
```

### Testing with pytest Fixtures

```python
# conftest.py
import pytest
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

@pytest.fixture
def bot():
    """Create bot instance for tests."""
    return Bot(token="TEST_TOKEN")

@pytest.fixture
def dp():
    """Create dispatcher with memory storage."""
    return Dispatcher(storage=MemoryStorage())

@pytest.fixture
async def setup_bot(dp):
    """Setup bot with all handlers."""
    from handlers import start, forms, menu

    dp.include_router(start.router)
    dp.include_router(forms.router)
    dp.include_router(menu.router)

    yield dp

    # Cleanup
    await dp.storage.close()
```

### Testing aiogram-dialog Windows

```python
@pytest.mark.asyncio
async def test_menu_dialog():
    """Test menu dialog window content."""
    from dialogs.menu import main_window, MenuStates

    # Mock dialog manager
    dialog_manager = MockDialogManager()

    # Render window
    content = await main_window.render_text(
        dialog_manager,
        state=MenuStates.main
    )

    assert "Main Menu" in content
```

---

## Integration Testing with Telethon

Integration tests use **real Telegram API** to test bot behavior as a user would experience it. This catches issues that unit tests miss.

**Why Integration Testing?**
- Tests real API interactions
- Verifies end-to-end flows
- Catches timing issues
- Tests UI interactions (buttons, keyboards)

**Resources:**
- [End-to-End Testing Guide](https://shallowdepth.online/posts/2021/12/end-to-end-tests-for-telegram-bots/)
- [Integration Testing Tutorial](https://dev.to/blueset/how-to-write-integration-tests-for-a-telegram-bot-4c0e)

### Setup for Integration Tests

**Requirements:**

```bash
pip install telethon pytest pytest-asyncio

# Using uv
uv pip install telethon pytest pytest-asyncio
```

**Get Telegram API Credentials:**
1. Visit https://my.telegram.org/apps
2. Create application
3. Get `api_id` and `api_hash`
4. Create test Telegram account (separate from main)

### Integration Test Setup

```python
# tests/conftest.py
import pytest
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

# Store session string in environment variable for CI/CD
SESSION_STRING = "YOUR_SESSION_STRING"  # From first login
API_ID = 12345  # Your API ID
API_HASH = "your_api_hash"  # Your API hash
BOT_USERNAME = "@your_bot"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def client():
    """Create Telethon client (acts as user)."""
    client = TelegramClient(
        StringSession(SESSION_STRING),
        API_ID,
        API_HASH
    )
    await client.start()
    yield client
    await client.disconnect()

@pytest.fixture(scope="session")
async def bot_process():
    """Start bot in background for tests."""
    import subprocess
    import time

    # Start bot
    process = subprocess.Popen(["python", "bot.py"])
    time.sleep(2)  # Wait for bot to start

    yield process

    # Stop bot
    process.terminate()
    process.wait()

@pytest.fixture
async def conversation(client):
    """Create conversation with bot."""
    async with client.conversation(BOT_USERNAME) as conv:
        # Send /start to initialize
        await conv.send_message("/start")
        await conv.get_response()

        yield conv
```

### Integration Test Examples

```python
# tests/test_integration.py
import pytest
from telethon.tl.custom import Conversation

@pytest.mark.asyncio
async def test_start_command(conversation: Conversation):
    """Test /start command flow."""
    await conversation.send_message("/start")
    response = await conversation.get_response()

    assert "Welcome" in response.text
    assert response.buttons  # Has keyboard

@pytest.mark.asyncio
async def test_registration_flow(conversation: Conversation):
    """Test complete registration flow."""
    # Start registration
    await conversation.send_message("/register")
    response = await conversation.get_response()
    assert "name" in response.text.lower()

    # Enter name
    await conversation.send_message("John Doe")
    response = await conversation.get_response()
    assert "age" in response.text.lower()

    # Enter age
    await conversation.send_message("25")
    response = await conversation.get_response()
    assert "email" in response.text.lower()

    # Enter email
    await conversation.send_message("john@example.com")
    response = await conversation.get_response()
    assert "confirm" in response.text.lower()

    # Confirm
    await conversation.send_message("yes")
    response = await conversation.get_response()
    assert "complete" in response.text.lower()

@pytest.mark.asyncio
async def test_inline_keyboard(conversation: Conversation):
    """Test inline keyboard interaction."""
    await conversation.send_message("/menu")
    response = await conversation.get_response()

    # Find "Settings" button
    settings_button = None
    for row in response.buttons:
        for button in row:
            if "Settings" in button.text:
                settings_button = button
                break

    assert settings_button is not None

    # Click button
    await settings_button.click()
    response = await conversation.get_edit()  # Wait for message edit

    assert "Settings" in response.text
```

### Testing Dialog Flows

```python
@pytest.mark.asyncio
async def test_product_selection(conversation: Conversation):
    """Test aiogram-dialog product selection."""
    await conversation.send_message("/shop")
    response = await conversation.get_response()

    # Find product button
    laptop_button = None
    for row in response.buttons:
        for button in row:
            if "Laptop" in button.text:
                laptop_button = button
                break

    assert laptop_button is not None

    # Select product
    await laptop_button.click()

    # Wait a bit for processing (important for CI/CD)
    import asyncio
    await asyncio.sleep(0.5)

    response = await conversation.get_edit()
    assert "added to cart" in response.text.lower()
```

### Helper Functions for Integration Tests

```python
# tests/helpers.py
import asyncio
from telethon.tl.custom import Message

async def find_button(message: Message, text: str):
    """Find button by text."""
    if not message.buttons:
        return None

    for row in message.buttons:
        for button in row:
            if text in button.text:
                return button
    return None

async def click_and_wait(button, conv, delay=0.5):
    """Click button and wait for response."""
    await button.click()
    await asyncio.sleep(delay)
    return await conv.get_edit()

# Usage in tests
@pytest.mark.asyncio
async def test_with_helpers(conversation):
    await conversation.send_message("/menu")
    response = await conversation.get_response()

    settings = await find_button(response, "Settings")
    assert settings is not None

    response = await click_and_wait(settings, conversation)
    assert "Settings" in response.text
```

### Best Practices for Integration Tests

**1. Add Delays for Stability**
```python
import asyncio

# After bot actions, especially in CI/CD
await asyncio.sleep(0.5)
```

**2. Use Random Data**
```python
import uuid

# Avoid database cleanup
username = f"test_user_{uuid.uuid4().hex[:8]}"
```

**3. Isolate Tests**
```python
# Clear state between tests
@pytest.fixture(autouse=True)
async def reset_state(conversation):
    await conversation.send_message("/cancel")
    yield
```

**4. Test Realistic Scenarios**
```python
@pytest.mark.asyncio
async def test_error_recovery(conversation):
    """Test bot handles invalid input gracefully."""
    await conversation.send_message("/register")
    await conversation.get_response()

    # Send invalid age
    await conversation.send_message("abc")
    response = await conversation.get_response()

    assert "valid number" in response.text.lower()

    # Retry with valid age
    await conversation.send_message("25")
    response = await conversation.get_response()
    assert "email" in response.text.lower()
```

---

## Testing Strategy Overview

### Unit Tests (Fast, Isolated)

**What to Test:**
- ✅ Handler logic
- ✅ FSM state transitions
- ✅ Keyboard generation
- ✅ Text formatting
- ✅ Validation logic

**Tools:**
- aiogram-tests
- pytest
- MockedBot

**Example:**
```python
# Unit test - fast, no API
test_registration_validates_age()
test_menu_returns_correct_keyboard()
```

### Integration Tests (Slow, Realistic)

**What to Test:**
- ✅ Complete user flows
- ✅ Button interactions
- ✅ Multi-step dialogs
- ✅ Error handling
- ✅ UI/UX verification

**Tools:**
- Telethon
- pytest
- Real Telegram API

**Example:**
```python
# Integration test - slow, real API
test_complete_registration_flow()
test_product_purchase_with_payment()
```

### Test Pyramid

```
        /\
       /  \  Integration Tests (Few, Slow, Realistic)
      /____\
     /      \
    /        \ Unit Tests (Many, Fast, Isolated)
   /__________\
```

**Ratio:** ~80% unit tests, ~20% integration tests

---

## CI/CD Testing Setup

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-asyncio aiogram-tests

    - name: Run unit tests
      run: pytest tests/unit/

    - name: Run integration tests
      env:
        BOT_TOKEN: ${{ secrets.BOT_TOKEN }}
        TELETHON_API_ID: ${{ secrets.TELETHON_API_ID }}
        TELETHON_API_HASH: ${{ secrets.TELETHON_API_HASH }}
        TELETHON_SESSION: ${{ secrets.TELETHON_SESSION }}
      run: pytest tests/integration/
```

### Test Coverage

```bash
# Install coverage
pip install pytest-cov

# Run with coverage
pytest --cov=handlers --cov=dialogs --cov-report=html

# View report
open htmlcov/index.html
```

---

## Resources

### Official Documentation
- [aiogram 3.x Docs](https://docs.aiogram.dev/)
- [aiogram-dialog Docs](https://aiogram-dialog.readthedocs.io/)
- [Scenes Documentation](https://docs.aiogram.dev/en/latest/dispatcher/finite_state_machine/scene.html)
- [i18n Documentation](https://docs.aiogram.dev/en/latest/utils/i18n.html)
- [Magic Filters](https://docs.aiogram.dev/en/latest/dispatcher/filters/magic_filters.html)

### GitHub Repositories
- [aiogram/aiogram](https://github.com/aiogram/aiogram) - Core framework
- [Tishka17/aiogram_dialog](https://github.com/Tishka17/aiogram_dialog) - Dialog framework (874⭐)
- [aiogram/i18n](https://github.com/aiogram/i18n) - Internationalization
- [OCCASS/aiogram_tests](https://github.com/OCCASS/aiogram_tests) - Testing library (71⭐)

### Testing Resources
- [End-to-End Testing Guide](https://shallowdepth.online/posts/2021/12/end-to-end-tests-for-telegram-bots/)
- [Integration Testing Tutorial](https://dev.to/blueset/how-to-write-integration-tests-for-a-telegram-bot-4c0e)
- [Writing Tests Wiki](https://github.com/python-telegram-bot/python-telegram-bot/wiki/Writing-Tests)

### Tools
- [@BotFather](https://t.me/BotFather) - Create and manage bots
- [aiogram Examples](https://github.com/aiogram/aiogram/tree/dev-3.x/examples)
- [aiogram-dialog Examples](https://github.com/Tishka17/aiogram_dialog/tree/develop/example)

---

## Key Takeaways

`★ Insight ─────────────────────────────────────`
**1. The aiogram Ecosystem is Modular**
- Core aiogram: FSM, routers, middleware
- aiogram-dialog: GUI framework with windows/widgets
- Scenes: Isolated conversation contexts
- aiogram-i18n: Multi-language support
- Use combinations that fit your needs

**2. Choose the Right Tool**
- Simple forms → FSM
- GUI-like menus → aiogram-dialog
- Isolated workflows → Scenes
- Multi-language → aiogram-i18n
- Expressive filters → Magic Filter (F)

**3. aiogram-dialog Transforms UX**
- Declarative window definitions
- Reusable widgets (calendars, selects, counters)
- Automatic message updates
- Offline HTML preview
- Transition diagrams

**4. Scenes Enable Context Isolation**
- SceneWizard for navigation
- Entry/exit lifecycle hooks
- Global handlers bypassed
- Perfect for quizzes, onboarding

**5. Testing is Essential**
- Unit tests (aiogram-tests): Fast, isolated, 80% coverage
- Integration tests (Telethon): Slow, realistic, 20% coverage
- Test pyramid: Many units, few integration
- CI/CD: Automate both test types
- Coverage: Target 80%+ for production bots

**6. Production-Ready Stack**
- Redis storage for persistence
- i18n for internationalization
- Middleware for auth/logging
- Error handling for reliability
- Comprehensive test suite
─────────────────────────────────────────────────`
