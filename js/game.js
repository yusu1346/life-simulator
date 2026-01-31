// 游戏主逻辑

class Game {
    constructor() {
        this.character = null;
        this.eventSystem = new EventSystem();
        this.isPlaying = false;
        this.selectedGender = null;
        this.selectedFamily = null;
    }
    
    // 选择性别
    selectGender(gender) {
        this.selectedGender = gender;
        document.getElementById('family-selection').style.display = 'block';
    }
    
    // 选择家庭
    selectFamily(familyType) {
        this.selectedFamily = familyType;
        this.startGame();
    }
    
    // 开始游戏
    startGame() {
        // 随机生成天赋
        const availableTalents = [...GameData.talents];
        const selectedTalents = [];
        
        // 随机选择2个天赋（1正1负）
        const positiveTalents = availableTalents.filter(t => !t.negative);
        const negativeTalents = availableTalents.filter(t => t.negative);
        
        if (positiveTalents.length > 0) {
            selectedTalents.push(positiveTalents[Math.floor(Math.random() * positiveTalents.length)]);
        }
        if (Math.random() < 0.3 && negativeTalents.length > 0) {
            selectedTalents.push(negativeTalents[Math.floor(Math.random() * negativeTalents.length)]);
        }
        
        // 生成姓名
        const name = this.generateName(this.selectedGender);
        
        // 创建角色
        this.character = new Character(
            name,
            this.selectedGender,
            this.selectedFamily,
            null,
            selectedTalents
        );
        
        this.isPlaying = true;
        
        // 切换到游戏界面
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        // 初始化UI
        this.updateUI();
        
        // 显示出生事件
        this.showEvent('欢迎来到这个世界', `你出生在了一个${this.selectedFamily}家庭，父母给你取名${name}`);
    }
    
    // 生成随机姓名
    static generateName(gender) {
        const surnames = GameData.names.surnames;
        const names = gender === '男' ? GameData.names.male : GameData.names.female;
        
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return surname + name;
    }
    
    // 下一年
    nextYear() {
        if (!this.character || !this.character.isAlive()) return;
        
        // 年龄增加
        this.character.age++;
        this.character.stage = this.character.getStage();
        
        // 更新职业经验
        if (this.character.occupation !== '无') {
            this.character.careerExp++;
            
            // 定期涨薪
            if (this.character.careerExp % 5 === 0) {
                const career = GameData.careers.find(c => c.name === this.character.occupation);
                if (career) {
                    this.character.money += career.baseSalary;
                }
            }
        }
        
        // 检查死亡
        const deathChance = this.character.age < 60 ? 0 : (this.character.age - 59) * 0.02;
        if (this.character.health <= 0 || (Math.random() < deathChance && this.character.age > 50)) {
            this.handleDeath();
            return;
        }
        
        // 先检查阶段事件
        const stageEvent = this.eventSystem.getStageEvent(this.character);
        if (stageEvent) {
            this.currentEvent = stageEvent;
            this.showEvent(stageEvent.title, stageEvent.description, stageEvent.choices);
        } else {
            // 再检查随机事件
            const randomEvent = this.eventSystem.getRandomEvent(this.character);
            if (randomEvent) {
                this.eventSystem.applyChoiceEffects(this.character, randomEvent);
                this.showEvent(randomEvent.title, randomEvent.description);
            } else {
                // 普通年份
                this.showNormalYear();
            }
        }
        
        // 自然属性变化
        this.naturalAging();
        
        // 检查成就
        this.checkAchievements();
        
        // 更新UI
        this.updateUI();
        
        // 自动保存
        if (this.character.age % 5 === 0) {
            SaveSystem.autoSave();
        }
    }
    
    // 处理选择
    handleChoice(choiceIndex) {
        if (!this.currentEvent) return;
        
        this.eventSystem.handleChoice(this.character, choiceIndex, () => {
            // 选择后的回调
            console.log('选择已处理，即将进入下一年');
        });
    }
    
    // 普通年份
    showNormalYear() {
        const messages = [
            `${this.character.age}岁，${this.character.occupation || this.character.stage}的平凡一年平凡一年`,
            `岁月如梭，${this.character.name}迎来了${this.character.age}岁生日`,
            `${this.character.age}岁，生活平淡但充实`,
            `${this.character.name}的${this.character.age}岁，没有特别的事情发生`
        ];
        
        this.showEvent('平凡的一年', messages[Math.floor(Math.random() * messages.length)]);
    }
    
    // 自然老化
    naturalAging() {
        const c = this.character;
        
        // 健康随年龄下降
        if (c.age > 50) {
            c.health = Math.max(0, c.health - 2);
        } else if (c.age > 30) {
            c.health = Math.max(0, c.health - 1);
        }
        
        // 随机属性成长
        c.iq = Math.max(0, c.iq + Math.floor(Math.random() * 3) - 1);
        c.eq = Math.max(0, c.eq + Math.floor(Math.random() * 3) - 1);
        c.moral = Math.max(0, c.moral + Math.floor(Math.random() * 3) - 1);
        
        // 随机社交变化
        if (Math.random() < 0.3) {
            c.social = Math.max(0, c.social + Math.floor(Math.random() * 10) - 5);
        }
    }
    
    // 显示事件
    showEvent(title, description, choices = null) {
        const eventContent = document.getElementById('event-content');
        const choiceArea = document.getElementById('choice-area');
        
        eventContent.innerHTML = `
            <div class="event-title">${title}</div>
            <div class="event-description">${description}</div>
        `;
        
        if (choices && choices.length > 0) {
            choiceArea.innerHTML = '';
            choices.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice.text;
                btn.onclick = () => this.handleChoice(index);
                choiceArea.appendChild(btn);
            });
        } else {
            choiceArea.innerHTML = '';
        }
    }
    
    // 死亡处理
    handleDeath() {
        this.isPlaying = false;
        
        // 记录死亡
        const member = GameData.familyTree.members[this.character.id];
        if (member) {
            member.lifespan = this.character.age;
        }
        
        // 显示死亡界面
        this.showDeathScreen();
    }
    
    // 显示死亡界面
    showDeathScreen() {
        const c = this.character;
        
        // 统计成就
        const unlockedAchievements = [];
        for (let [key, achievement] of Object.entries(GameData.achievements)) {
            if (achievement.condition(c)) {
                unlockedAchievements.push(`${achievement.icon} ${key}`);
            }
        }
        
        // 生成人生总结
        const summary = `
            <div style="margin: 20px 0;">
                <p><strong>👤</strong> ${c.name} (${c.gender})</p>
                <p><strong>💼</strong> ${c.occupation}</p>
                <p><strong>🎓</strong> ${c.education}</p>
                <p><strong>💰</strong> 遗产: ¥${c.money}</p>
                <p><strong>🏠</strong> 房产: ${c.assets.house}</p>
                <p><strong>🚗</strong> 车辆: ${c.assets.car}</p>
                <p><strong>👨‍👩‍👧‍👦</strong> 子女: ${c.children.length}人</p>
                <p><strong>🏆</strong> 成就: ${unlockedAchievements.length}个</p>
                <div style="margin-top: 10px;">
                    ${unlockedAchievements.join(' ')}
                </div>
            </div>
        `;
        
        document.getElementById('death-info').innerHTML = summary;
        
        // 显示继承选项
        if (c.children.length > 0) {
            const inheritSection = document.getElementById('inherit-section');
            const inheritChoices = document.getElementById('inherit-choices');
            
            let html = '';
            c.children.forEach(childId => {
                const child = GameData.familyTree.members[childId];
                if (child && !child.lifespan) {
                    html += `
                        <div class="child-option" onclick="Game.inheritLife(${childId})">
                            <strong>${child.name}</strong> (${child.gender})
                            <div style="font-size: 12px; opacity: 0.8;">
                                ${child.familyType}家庭出身
                            </div>
                        </div>
                    `;
                }
            });
            
            if (html) {
                inheritChoices.innerHTML = html;
                inheritSection.style.display = 'block';
            }
        }
        
        // 切换到死亡界面
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('death-screen').classList.add('active');
    }
    
    // 继承人生
    inheritLife(childId) {
        const childMember = GameData.familyTree.members[childId];
        if (!childMember) return;
        
        // 创建继承角色
        const talents = [...this.character.talents].slice(0, 2);
        const newCharacter = new Character(
            childMember.name,
            childMember.gender,
            childMember.familyType,
            this.character,
            talents
        );
        
        // 继承部分属性（遗传）
        newCharacter.iq = Math.max(30, Math.floor(this.character.iq * 0.4 + Math.random() * 40));
        newCharacter.eq = Math.max(30, Math.floor(this.character.eq * 0.4 + Math.random() * 40));
        newCharacter.money = Math.floor(this.character.money / (this.character.children.length || 1));
        newCharacter.health = newCharacter.healthMax;
        
        // 切换角色
        this.character = newCharacter;
        
        // 返回游戏
        document.getElementById('death-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        this.updateUI();
        this.showEvent('继承人生', `你继承了${childMember.parentName || '父母'}的遗产，成为了${newCharacter.name}`);
    }
    
    // 检查成就
    checkAchievements() {
        const c = this.character;
        
        for (let [key, achievement] of Object.entries(GameData.achievements)) {
            if (achievement.condition(c) && !c.achievements.includes(key)) {
                c.achievements.push(key);
                this.showEvent('🏆 解锁成就', `你获得了成就：${achievement.icon} ${key}`);
            }
        }
    }
    
    // 更新UI
    updateUI() {
        if (!this.character) return;
        
        const c = this.character;
        
        // 更新基本信息
        document.getElementById('char-name').textContent = c.name;
        document.getElementById('char-age').textContent = `${c.age}岁`;
        document.getElementById('char-stage').textContent = c.stage;
        document.getElementById('char-occupation').textContent = c.occupation !== '无' ? ` - ${c.occupation}` : '';
        
        // 更新属性条
        this.updateStatBar('iq', c.iq, 0, 200);
        this.updateStatBar('eq', c.eq, 0, 200);
        this.updateStatBar('health', c.health, 0, c.healthMax);
        this.updateStatBar('moral', c.moral, 0, 200);
        
        // 更新数值
        document.getElementById('iq-value').textContent = c.iq;
        document.getElementById('eq-value').textContent = c.eq;
        document.getElementById('health-value').textContent = c.health;
        document.getElementById('moral-value').textContent = c.moral;
        
        // 更新资产
        document.getElementById('money-value').textContent = c.money;
        document.getElementById('house-value').textContent = c.assets.house;
        document.getElementById('car-value').textContent = c.assets.car;
        
        // 更新天赋
        this.updateTalents();
        
        // 更新关系
        this.updateRelations();
        
        // 更新成就
        this.updateAchievements();
        
        // 更新家族树
        this.updateFamilyTree();
    }
    
    // 更新属性条
    updateStatBar(stat, value, min, max) {
        const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
        const bar = document.getElementById(`${stat}-bar`);
        if (bar) {
            bar.style.width = `${percentage}%`;
        }
    }
    
    // 更新天赋
    updateTalents() {
        const talentsList = document.getElementById('talents-list');
        
        if (this.character.talents.length === 0) {
            talentsList.innerHTML = '<p class="empty">暂无天赋</p>';
            return;
        }
        
        let html = '';
        this.character.talents.forEach(talent => {
            const color = talent.negative ? '#e74c3c' : '#27ae60';
            html += `<span class="talent-tag" style="background: ${color};">${talent.name}</span>`;
        });
        talentsList.innerHTML = html;
    }
    
    // 更新关系
    updateRelations() {
        const relationsList = document.getElementById('relations-list');
        
        if (Object.keys(this.character.relations).length === 0) {
            relationsList.innerHTML = '<p class="empty">暂无关系</p>';
            return;
        }
        
        let html = '';
        for (let [type, relation] of Object.entries(this.character.relations)) {
            const hearts = '❤️'.repeat(Math.floor((relation.intimacy || 50) / 20));
            html += `
                <div class="relation-item">
                    <span>${type}: ${relation.name}</span>
                    <span>${hearts}</span>
                </div>
            `;
        }
        relationsList.innerHTML = html;
    }
    
    // 更新成就
    updateAchievements() {
        const achievementsList = document.getElementById('achievements-list');
        
        if (this.character.achievements.length === 0) {
            achievementsList.innerHTML = '<p class="empty">暂无成就</p>';
            return;
        }
        
        let html = '';
        this.character.achievements.forEach(achievementName => {
            const achievement = GameData.achievements[achievementName];
            if (achievement) {
                html += `<span class="achievement-badge">${achievement.icon} ${achievementName}</span>`;
            }
        });
        achievementsList.innerHTML = html;
    }
    
    // 更新家族树
    updateFamilyTree() {
        const familyTree = document.getElementById('family-tree');
        
        if (Object.keys(GameData.familyTree.members).length === 0) {
            familyTree.innerHTML = '<p class="empty">家族树为空</p>';
            return;
        }
        
        let html = '';
        function addMember(member, level = 0) {
            const indent = level * 20;
            const status = member.lifespan ? `☠️ ${member.lifespan}岁` : '🟢 在世';
            
            html += `
                <div class="family-member" style="margin-left: ${indent}px;" 
                     onclick="Game.showMemberInfo(${member.id})">
                    <strong>${member.name}</strong> (${member.gender}) - ${status}
                </div>
            `;
            
            // 显示子女
            member.children.forEach(childId => {
                const child = GameData.familyTree.members[childId];
                if (child) {
                    addMember(child, level + 1);
                }
            });
        }
        
        // 从第一代开始
        const firstGen = Object.values(GameData.familyTree.members).find(m => !m.parent);
        if (firstGen) addMember(firstGen);
        
        familyTree.innerHTML = html;
    }
}
