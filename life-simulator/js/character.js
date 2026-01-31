// 角色系统

class Character {
    constructor(name, gender, familyType, parent = null, talents = []) {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.gender = gender;
        this.familyType = familyType;
        this.age = 0;
        this.stage = '婴儿期';
        this.occupation = '无';
        this.education = '未入学';
        
        // 基础属性
        this.iq = 40 + Math.floor(Math.random() * 30);
        this.eq = 40 + Math.floor(Math.random() * 30);
        this.health = 100;
        this.healthMax = 100;
        this.money = 0;
        this.moral = 40 + Math.floor(Math.random() * 30);
        this.social = 0;
        this.luck = 0;
        
        // 资产
        this.assets = {
            house: '无',
            car: '无'
        };
        
        // 天赋
        this.talents = talents || [];
        this.applyTalents();
        
        // 初始家庭加成
        this.applyFamilyBonus(familyType);
        
        // 关系
        this.relations = {};
        this.spouse = null;
        this.children = [];
        this.parent = parent ? parent.id : null;
        
        // 人生轨迹
        this.lifePath = [];
        this.achievements = [];
        
        // 职业经验
        this.careerExp = 0;
        
        // 添加到家族树
        if (parent) {
            this.relations['父母'] = { name: parent.name, intimacy: 70 };
        }
    }
    
    applyTalents() {
        this.talents.forEach(talent => {
            if (talent.effect.iq) this.iq += talent.effect.iq;
            if (talent.effect.eq) this.eq += talent.effect.eq;
            if (talent.effect.health) this.healthMax += talent.effect.health;
            if (talent.effect.moral) this.moral += talent.effect.moral;
            if (talent.effect.luck) this.luck += talent.effect.luck;
        });
        this.health = this.healthMax;
    }
    
    applyFamilyBonus(type) {
        switch(type) {
            case '富裕':
                this.money = 500 + Math.floor(Math.random() * 500);
                this.eq += 15;
                this.education = '贵族幼儿园';
                break;
            case '中产':
                this.money = 200 + Math.floor(Math.random() * 300);
                this.iq += 5;
                this.eq += 5;
                this.healthMax += 5;
                break;
            case '普通':
                this.money = 50 + Math.floor(Math.random() * 150);
                break;
            case '贫困':
                this.iq += 15;
                this.moral += 10;
                this.money = Math.floor(Math.random() * 100);
                break;
        }
        this.health = this.healthMax;
    }
    
    getStage() {
        if (this.age < 3) return '婴儿期';
        if (this.age < 12) return '童年期';
        if (this.age < 18) return '青春期';
        if (this.age < 60) return '成年期';
        return '老年期';
    }
    
    isAlive() {
        return this.health > 0 && this.age < 100;
    }
    
    addRelation(type, name, intimacy = 50) {
        this.relations[type] = { name, intimacy };
    }
    
    addLifeEvent(eventDesc) {
        this.lifePath.push({
            age: this.age,
            stage: this.getStage(),
            description: eventDesc,
            timestamp: Date.now()
        });
    }
}
