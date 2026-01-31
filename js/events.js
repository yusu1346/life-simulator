// 事件处理系统

class EventSystem {
    constructor() {
        this.currentEvent = null;
        this.eventHistory = [];
    }
    
    // 获取当前阶段事件
    getStageEvent(character) {
        const age = character.age;
        const stage = character.getStage();
        
        // 固定年龄事件（优先触发）
        if (age === 1) return this.getEventById('zhua_zhou');
        if (age === 3) return this.getEventById('kindergarten');
        if (age === 6) return this.getEventById('primary_school');
        if (age === 12) return this.getEventById('middle_school');
        if (age === 15) return this.getEventById('high_school_choice');
        if (age === 16) return this.getEventById('arts_or_science');
        if (age === 18) return this.getEventById('gaokao');
        if (age === 22) return this.getEventById('college_major');
        if (age === 25) return this.getEventById('career_choice');
        if (age === 30) return this.getEventById('marriage');
        if (age === 35) return this.getEventById('children');
        if (age === 60) return this.getEventById('retirement');
        
        // 阶段随机事件
        const stageEvents = GameData.events[stage];
        if (stageEvents && Math.random() < 0.6) {
            const totalWeight = stageEvents.reduce((sum, e) => sum + e.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (let event of stageEvents) {
                random -= event.weight;
                if (random <= 0) return event;
            }
        }
        
        return null;
    }
    
    // 获取随机事件
    getRandomEvent(character) {
        const stage = character.getStage();
        const luck = character.luck / 100;
        
        // 根据阶段和运气调整概率
        const baseChance = 0.3 + luck;
        if (Math.random() > baseChance) return null;
        
        // 根据类型随机选择事件
        const eventTypes = Object.keys(GameData.randomEvents);
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const events = GameData.randomEvents[randomType];
        
        const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let event of events) {
            random -= event.weight;
            if (random <= 0) return event;
        }
        
        return events[0];
    }
    
    // 处理选择
    handleChoice(character, choiceIndex, callback) {
        if (!this.currentEvent || !this.currentEvent.choices) return;
        
        const choice = this.currentEvent.choices[choiceIndex];
        if (!choice) return;
        
        // 应用效果
        this.applyChoiceEffects(character, choice);
        
        // 记录历史
        this.eventHistory.push({
            age: character.age,
            event: this.currentEvent.title,
            choice: choice.text,
            timestamp: Date.now()
        });
        
        // 触发特殊行动
        if (choice.action) {
            this.handleSpecialAction(character, choice.action);
        }
        
        // 直接跳转到下一年
        setTimeout(() => {
            callback();
            Game.nextYear();
        }, 1000);
    }
    
    // 应用选择效果
    applyChoiceEffects(character, choice) {
        if (!choice.effect) return;
        
        const effect = choice.effect;
        
        // 属性变化
        if (effect.iq) character.iq += effect.iq;
        if (effect.eq) character.eq += effect.eq;
        if (effect.health) character.health = Math.max(0, Math.min(character.healthMax, character.health + effect.health));
        if (effect.moral) character.moral += effect.moral;
        if (effect.social) character.social += effect.social;
        if (effect.money) character.money += effect.money;
        if (effect.moneyRate) character.moneyRate = (character.moneyRate || 1) * effect.moneyRate;
        
        // 职业变化
        if (effect.occupation) character.occupation = effect.occupation;
        
        // 资产变化
        if (effect.assets) {
            Object.assign(character.assets, effect.assets);
        }
        
        // 添加人生事件
        character.addLifeEvent(choice.description || choice.text);
    }
    
    // 处理特殊行动
    handleSpecialAction(character, action) {
        switch(action) {
            case 'marry':
                this.marry(character);
                break;
            case 'haveChild':
                this.haveChild(character);
                break;
            case 'divorce':
                this.divorce(character);
                break;
            case 'buyHouse':
                this.buyHouse(character);
                break;
            case 'buyCar':
                this.buyCar(character);
                break;
        }
    }
    
    // 结婚事件
    marry(character) {
        const spouseName = Game.generateName(character.gender === '男' ? '女' : '男');
        character.spouse = {
            name: spouseName,
            gender: character.gender === '男' ? '女' : '男',
            age: character.age - 2 + Math.floor(Math.random() * 5)
        };
        character.addRelation('配偶', spouseName, 80);
        
        // 更新家族树
        const member = GameData.familyTree.members[character.id];
        if (member) member.spouse = spouseName;
        
        // 触发婚礼
        character.money -= 100;
        character.addRelation('岳父母/公婆', '未知', 40);
    }
    
    // 生子事件
    haveChild(character) {
        const childGender = Math.random() > 0.5 ? '男' : '女';
        const childName = Game.generateName(childGender);
        
        const child = new Character(childName, childGender, '普通', character);
        character.children.push(child.id);
        
        // 更新家族树
        const member = GameData.familyTree.members[character.id];
        if (member) member.children.push(child.id);
        
        // 添加关系
        character.addRelation('子女', childName, 90);
        
        // 养育成本
        character.money -= 150;
    }
    
    // 离婚事件
    divorce(character) {
        if (!character.spouse) return;
        
        character.addLifeEvent(`与${character.spouse.name}离婚`);
        character.spouse = null;
        delete character.relations['配偶'];
        character.social -= 10;
        character.money = Math.floor(character.money * 0.7); // 财产分割
    }
    
    // 买房事件
    buyHouse(character) {
        character.assets.house = '一套房产';
        character.money -= 300;
        character.social += 10;
        character.addLifeEvent('购买了一套房产');
    }
    
    // 买车事件
    buyCar(character) {
        character.assets.car = '一辆汽车';
        character.money -= 150;
        character.social += 5;
        character.addLifeEvent('购买了一辆汽车');
    }
    
    // 获取特定ID的事件
    getEventById(eventId) {
        // 可以在这里实现事件ID映射
        // 简化版本直接返回阶段事件
        return GameData.events['婴儿期'][0];
    }
}
